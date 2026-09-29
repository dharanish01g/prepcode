mod auth;
mod files;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(auth::AuthLock::default())
        .manage(auth::CurrentUser::default())
        .invoke_handler(tauri::generate_handler![
            auth::register,
            auth::login,
            auth::logout,
            files::list_files,
            files::create_file,
            files::read_file,
            files::write_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
