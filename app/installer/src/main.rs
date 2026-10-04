//! prepcode's online installer for Windows: a small setup file that always
//! installs the newest release. It reads the same latest.json the in-app
//! updater uses, downloads that version's installer, checks its signature, and
//! runs it. So an old copy of this file, passed around on a USB stick, still
//! installs the latest prepcode.

#![cfg_attr(windows, windows_subsystem = "windows")]

#[cfg(windows)]
mod dialog;
mod release;

#[cfg(windows)]
fn main() {
    dialog::run();
}

/// Elsewhere (for trying it out): the same steps, printed, without running the installer.
#[cfg(not(windows))]
fn main() {
    let agent = release::agent();
    let result = release::latest(&agent).and_then(|latest| {
        println!("Latest: prepcode {}", latest.version);
        let data = release::download(&agent, &latest, |_, _| true)?;
        release::verify(&data, &latest)?;
        let path = std::env::temp_dir().join(latest.file_name());
        std::fs::write(&path, &data).map_err(|e| e.to_string())?;
        Ok(path)
    });
    match result {
        Ok(path) => println!("Verified and saved to {}", path.display()),
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(1);
        }
    }
}
