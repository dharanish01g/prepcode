mod auth;
mod files;
mod run;
mod runtimes;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(auth::AuthLock::default())
        .manage(auth::CurrentUser::default())
        .manage(runtimes::RuntimeInstalls::default())
        .manage(run::Runner::default())
        .invoke_handler(tauri::generate_handler![
            auth::register,
            auth::login,
            auth::logout,
            files::list_files,
            files::create_file,
            files::read_file,
            files::write_file,
            runtimes::list_runtimes,
            runtimes::install_runtime,
            run::run_program,
            run::send_input,
            run::stop_program,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
