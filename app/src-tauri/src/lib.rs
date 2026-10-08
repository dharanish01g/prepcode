mod account;
mod auth;
mod catalog;
mod databases;
mod db;
mod files;
mod github;
mod reporting;
mod run;
mod runtimes;
mod sql;
mod sync;

use tauri::{Manager, RunEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // First, so a panic from here on is reported.
    let sentry = reporting::init_sentry();

    tauri::Builder::default()
        // Must come first. A second copy would delete the first one's guest
        // files when it starts and exits, so focus the open window instead.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_sentry::init(&sentry))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(auth::CurrentUser::default())
        .manage(auth::SignIn::default())
        .manage(auth::AccessToken::default())
        .manage(sync::SyncLock::default())
        .manage(sync::RepoTokens::default())
        .manage(runtimes::RuntimeInstalls::default())
        .manage(run::Runner::default())
        .manage(sql::Servers::default())
        .manage(files::WorkspaceLock::default())
        .setup(|app| {
            reporting::init_logging(app.handle())?;
            app.manage(db::open(app.handle())?);
            if let Err(e) = runtimes::check_installed(app.handle(), &app.state::<db::Db>()) {
                log::error!("Could not check the installed languages: {e}");
            }
            // Guest files from a session that ended without a clean exit.
            auth::delete_guest_files(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::restore_session,
            auth::start_github_sign_in,
            auth::finish_github_sign_in,
            auth::cancel_github_sign_in,
            auth::guest_login,
            auth::logout,
            catalog::list_languages,
            files::list_files,
            files::list_file_history,
            files::create_file,
            files::read_file,
            files::write_file,
            files::rename_file,
            files::delete_file,
            files::export_guest_files,
            runtimes::list_runtimes,
            runtimes::install_runtime,
            run::run_program,
            run::send_input,
            run::stop_program,
            sql::run_queries,
            sql::stop_queries,
            sql::list_tables,
            sql::table_rows,
            sync::sync_status,
            sync::sync_now,
            sync::pull_from_github,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                // Before deleting guest files: a running server holds its own.
                tauri::async_runtime::block_on(app.state::<sql::Servers>().stop());
                auth::delete_guest_files(app);
                reporting::flush();
            }
        });
}
