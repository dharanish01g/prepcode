//! Finding out why an update check failed.
//!
//! The updater only says "error sending request for url"; the reason (no DNS,
//! a timeout, a proxy or firewall, a certificate) is in the error's sources,
//! which it doesn't log. So when a check fails, this fetches the same URL
//! itself and reports what went wrong, once per run, as a warning: a student
//! pressing "Check for updates" on a blocked network isn't a bug in the app.

use std::error::Error as _;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use sentry::Level;
use tauri::{AppHandle, Runtime};

static REPORTED: AtomicBool = AtomicBool::new(false);

/// Reports a failed update check: `error` is what the updater said.
#[tauri::command]
pub async fn report_update_failure<R: Runtime>(app: AppHandle<R>, error: String) {
    if REPORTED.swap(true, Ordering::Relaxed) {
        return;
    }
    let Some(endpoint) = endpoint(&app) else { return };
    let (kind, detail) = probe(&endpoint).await;
    log::warn!("Update check failed ({kind}): {detail}");

    sentry::with_scope(
        |scope| {
            scope.set_tag("update.failure", kind);
            scope.set_extra("updater_error", error.into());
            scope.set_extra("probe", detail.into());
        },
        // One message, so every failure groups into one issue; the tag
        // says which kind it was.
        || sentry::capture_message("Update check failed", Level::Warning),
    );
}

/// The first endpoint in the updater's config.
fn endpoint<R: Runtime>(app: &AppHandle<R>) -> Option<String> {
    let updater = app.config().plugins.0.get("updater")?;
    Some(updater["endpoints"][0].as_str()?.to_owned())
}

/// Fetches `url` and says what happened: a short kind for grouping, and the
/// full error with its sources.
async fn probe(url: &str) -> (&'static str, String) {
    let client = match reqwest::Client::builder()
        .user_agent("prepcode")
        .connect_timeout(Duration::from_secs(20))
        .timeout(Duration::from_secs(30))
        .build()
    {
        Ok(client) => client,
        Err(e) => return ("client", chain(&e)),
    };
    // GitHub redirects to a download host; a firewall may block either.
    // Only the host is kept: the redirect's query string is a signed token.
    match client.get(url).send().await {
        Ok(response) if response.status().is_success() => {
            // Reached it this time: the network is flaky, or only just came up.
            ("ok", format!("{} from {}", response.status(), host(response.url())))
        }
        Ok(response) => ("status", format!("{} from {}", response.status(), host(response.url()))),
        Err(e) => {
            let at = e.url().map(host).unwrap_or_default();
            let e = e.without_url();
            (kind(&e), format!("{at}: {}", chain(&e)))
        }
    }
}

fn host(url: &reqwest::Url) -> String {
    url.host_str().unwrap_or_default().to_owned()
}

fn kind(error: &reqwest::Error) -> &'static str {
    let text = chain(error).to_lowercase();
    if error.is_timeout() || text.contains("timed out") {
        "timeout"
    } else if text.contains("dns") || text.contains("resolve") || text.contains("no such host") {
        "dns"
    } else if text.contains("certificate") || text.contains("tls") || text.contains("ssl") {
        "tls"
    } else if text.contains("proxy") {
        "proxy"
    } else if error.is_connect() {
        "connect"
    } else {
        "other"
    }
}

/// The error and each of its sources, joined with ": ".
fn chain(error: &reqwest::Error) -> String {
    let mut text = error.to_string();
    let mut source = error.source();
    while let Some(e) = source {
        text.push_str(": ");
        text.push_str(&e.to_string());
        source = e.source();
    }
    text
}
