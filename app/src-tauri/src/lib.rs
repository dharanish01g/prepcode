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
        .manage(auth::WaitingAccount::default())
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
            auth::start_google_sign_in,
            auth::start_google_link,
            auth::start_github_connect,
            auth::discard_waiting_account,
            auth::email_sign_up,
            auth::email_resend_code,
            auth::email_verify_code,
            auth::email_sign_in,
            auth::email_send_reset_code,
            auth::email_reset_password,
            auth::finish_sign_in,
            auth::cancel_sign_in,
            auth::account_details,
            auth::unlink_google,
            auth::guest_login,
            auth::logout,
            catalog::list_languages,
            files::list_files,
            files::list_file_history,
            files::create_file,
            files::read_file,
            files::write_file,
            files::read_practice,
            files::write_practice,
            files::mark_practice_solved,
            files::list_practice_solved,
            files::rename_file,
            files::delete_file,
            files::export_guest_files,
            runtimes::list_runtimes,
            runtimes::install_runtime,
            runtimes::remove_runtime,
            run::run_program,
            run::check_practice,
            run::send_input,
            run::stop_program,
            sql::run_queries,
            sql::stop_queries,
            sql::list_tables,
            sql::table_rows,
            sync::sync_status,
            sync::sync_now,
            sync::sync_practice,
            sync::pull_from_github,
            sync::repo_setup,
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
