//! A native Windows progress dialog (a task dialog) around the download, then
//! the real installer.

use std::cell::{Cell, RefCell};
use std::os::windows::ffi::OsStrExt;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::{ptr, thread};

use windows_sys::core::HRESULT;
use windows_sys::Win32::Foundation::{HWND, LPARAM, S_OK, WPARAM};
use windows_sys::Win32::System::LibraryLoader::GetModuleHandleW;
use windows_sys::Win32::UI::Controls::*;
use windows_sys::Win32::UI::Shell::ShellExecuteW;
use windows_sys::Win32::UI::WindowsAndMessaging::{
    MessageBoxW, SendMessageW, IDCANCEL, IDRETRY, MB_ICONERROR, MB_OK, MB_RETRYCANCEL, SW_SHOWNORMAL,
};

use crate::release;

const TITLE: &str = "prepcode setup";

enum Status {
    Checking,
    Downloading { version: String, done: u64, total: u64 },
    Verifying,
    Ready(PathBuf),
    Failed(String),
}

struct Shared {
    status: Mutex<Status>,
    cancel: AtomicBool,
}

impl Shared {
    fn set(&self, status: Status) {
        *self.status.lock().unwrap() = status;
    }
}

pub fn run() {
    loop {
        let shared =
            Arc::new(Shared { status: Mutex::new(Status::Checking), cancel: AtomicBool::new(false) });
        let worker = Arc::clone(&shared);
        thread::spawn(move || {
            let status = match fetch(&worker) {
                Ok(path) => Status::Ready(path),
                Err(message) => Status::Failed(message),
            };
            worker.set(status);
        });

        if !show_progress(&shared) {
            // Cancelled: stop the download; it ends with this process anyway.
            shared.cancel.store(true, Ordering::Relaxed);
            return;
        }
        let status = std::mem::replace(&mut *shared.status.lock().unwrap(), Status::Checking);
        match status {
            Status::Ready(path) => return launch(&path),
            Status::Failed(message) if retry(&message) => continue,
            _ => return,
        }
    }
}

/// Downloads and verifies the latest installer into the temp folder.
fn fetch(shared: &Shared) -> Result<PathBuf, String> {
    let agent = release::agent();
    let latest = release::latest(&agent)?;
    let data = release::download(&agent, &latest, |done, total| {
        shared.set(Status::Downloading { version: latest.version.clone(), done, total });
        !shared.cancel.load(Ordering::Relaxed)
    })?;
    shared.set(Status::Verifying);
    release::verify(&data, &latest)?;
    let path = std::env::temp_dir().join(latest.file_name());
    std::fs::write(&path, &data).map_err(|e| format!("The installer couldn't be saved: {e}"))?;
    Ok(path)
}

/// State the dialog's callback reads on each timer tick.
struct Dialog<'a> {
    shared: &'a Shared,
    /// Kept alive here: the dialog reads the text from this buffer.
    text: RefCell<Vec<u16>>,
    marquee: Cell<bool>,
    /// The download finished (or failed) and closed the dialog, rather than Cancel.
    finished: Cell<bool>,
}

/// Shows progress until the download finishes. False if the student cancelled.
fn show_progress(shared: &Shared) -> bool {
    let dialog = Dialog {
        shared,
        text: RefCell::new(Vec::new()),
        marquee: Cell::new(true),
        finished: Cell::new(false),
    };
    let title = wide(TITLE);
    let heading = wide("Getting the latest prepcode");
    let content = wide("Checking for the latest version…");
    unsafe {
        let mut config: TASKDIALOGCONFIG = std::mem::zeroed();
        config.cbSize = std::mem::size_of::<TASKDIALOGCONFIG>() as u32;
        config.hInstance = GetModuleHandleW(ptr::null());
        config.dwFlags = TDF_SHOW_MARQUEE_PROGRESS_BAR | TDF_CALLBACK_TIMER | TDF_ALLOW_DIALOG_CANCELLATION;
        config.dwCommonButtons = TDCBF_CANCEL_BUTTON;
        config.pszWindowTitle = title.as_ptr();
        // The icon embedded by installer.rc (resource 1).
        config.Anonymous1 = TASKDIALOGCONFIG_0 { pszMainIcon: 1 as _ };
        config.pszMainInstruction = heading.as_ptr();
        config.pszContent = content.as_ptr();
        config.pfCallback = Some(callback);
        config.lpCallbackData = &dialog as *const Dialog as isize;
        config.cxWidth = 260;
        TaskDialogIndirect(&config, ptr::null_mut(), ptr::null_mut(), ptr::null_mut());
    }
    dialog.finished.get()
}

unsafe extern "system" fn callback(hwnd: HWND, msg: u32, _: WPARAM, _: LPARAM, data: isize) -> HRESULT {
    let dialog = &*(data as *const Dialog);
    match msg as i32 {
        TDN_CREATED => {
            SendMessageW(hwnd, TDM_SET_PROGRESS_BAR_MARQUEE as u32, 1, 0);
        }
        TDN_TIMER => tick(hwnd, dialog),
        _ => {}
    }
    S_OK
}

fn tick(hwnd: HWND, dialog: &Dialog) {
    let text = match &*dialog.shared.status.lock().unwrap() {
        Status::Checking => return,
        Status::Downloading { version, done, total } => {
            if *total > 0 {
                if dialog.marquee.replace(false) {
                    unsafe {
                        SendMessageW(hwnd, TDM_SET_MARQUEE_PROGRESS_BAR as u32, 0, 0);
                        SendMessageW(hwnd, TDM_SET_PROGRESS_BAR_RANGE as u32, 0, (100 << 16) as LPARAM);
                    }
                }
                let percent = done * 100 / total;
                unsafe { SendMessageW(hwnd, TDM_SET_PROGRESS_BAR_POS as u32, percent as WPARAM, 0) };
                format!("Downloading prepcode {version}: {} of {}", mb(*done), mb(*total))
            } else {
                format!("Downloading prepcode {version}: {}", mb(*done))
            }
        }
        Status::Verifying => "Checking the download…".to_string(),
        Status::Ready(_) | Status::Failed(_) => {
            dialog.finished.set(true);
            unsafe { SendMessageW(hwnd, TDM_CLICK_BUTTON as u32, IDCANCEL as WPARAM, 0) };
            return;
        }
    };
    let text = wide(&text);
    if *dialog.text.borrow() != text {
        *dialog.text.borrow_mut() = text;
        let ptr = dialog.text.borrow().as_ptr();
        unsafe { SendMessageW(hwnd, TDM_SET_ELEMENT_TEXT as u32, TDE_CONTENT as WPARAM, ptr as LPARAM) };
    }
}

fn mb(bytes: u64) -> String {
    format!("{:.1} MB", bytes as f64 / 1_000_000.0)
}

/// Asks to try again after a failure.
fn retry(message: &str) -> bool {
    let (text, title) = (wide(message), wide(TITLE));
    unsafe {
        MessageBoxW(ptr::null_mut(), text.as_ptr(), title.as_ptr(), MB_RETRYCANCEL | MB_ICONERROR) == IDRETRY
    }
}

/// Runs the downloaded installer. ShellExecute, unlike spawning it directly,
/// would still show Windows' admin prompt if an installer ever needed one.
fn launch(path: &Path) {
    let file: Vec<u16> = path.as_os_str().encode_wide().chain(Some(0)).collect();
    let open = wide("open");
    let result = unsafe {
        ShellExecuteW(ptr::null_mut(), open.as_ptr(), file.as_ptr(), ptr::null(), ptr::null(), SW_SHOWNORMAL)
    };
    if result as isize <= 32 {
        let (text, title) =
            (wide("The installer couldn't be started. Try running prepcode setup again."), wide(TITLE));
        unsafe { MessageBoxW(ptr::null_mut(), text.as_ptr(), title.as_ptr(), MB_OK | MB_ICONERROR) };
    }
}

fn wide(text: &str) -> Vec<u16> {
    text.encode_utf16().chain(Some(0)).collect()
}
