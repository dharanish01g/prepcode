mod auth;
mod catalog;
mod db;
mod files;
mod run;
mod runtimes;

use tauri::{Manager, RunEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(auth::CurrentUser::default())
        .manage(runtimes::RuntimeInstalls::default())
        .manage(run::Runner::default())
        .setup(|app| {
            app.manage(db::open(app.handle())?);
            // Guest files from a session that ended without a clean exit.
            auth::delete_guest_files(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::register,
            auth::login,
            auth::logout,
            auth::guest_login,
            catalog::list_languages,
            files::list_files,
            files::list_file_history,
            files::create_file,
            files::read_file,
            files::write_file,
            files::rename_file,
            files::delete_file,
            runtimes::list_runtimes,
            runtimes::install_runtime,
            run::run_program,
            run::send_input,
            run::stop_program,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                auth::delete_guest_files(app);
            }
        });
}
