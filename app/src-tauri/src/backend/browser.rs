//! This computer's half of signing in in the browser, the same whatever the
//! backend is.
//!
//! The browser comes back to a one-off address on this computer,
//! `http://127.0.0.1:<free port>/auth/callback`, with a one-time code. The
//! code only works together with a PKCE verifier that never leaves this
//! process, so another program catching it can't use it.

use std::time::Duration;

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use reqwest::Url;
use sha2::{Digest, Sha256};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

const CALLBACK_PATH: &str = "/auth/callback";

/// Where the browser comes back to on `port`, once signed in.
pub fn callback_url(port: u16) -> String {
    format!("http://127.0.0.1:{port}{CALLBACK_PATH}")
}

/// The PKCE pair for one sign-in: the challenge goes to the backend now, the
/// verifier only with the one-time code.
pub struct Pkce {
    pub verifier: String,
    pub challenge: String,
}

pub fn pkce() -> Result<Pkce, String> {
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes).map_err(|e| format!("Could not start signing in: {e}"))?;
    let verifier = URL_SAFE_NO_PAD.encode(bytes);
    let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));
    Ok(Pkce { verifier, challenge })
}

/// Waits for the browser to come back to `listener` after signing in, and
/// tells it it can close the tab. Returns the one-time code. Other requests
/// (e.g. the tab asking for an icon) get a 404 and are ignored.
pub async fn wait_for_code(listener: &TcpListener) -> Result<String, String> {
    loop {
        let Ok((mut stream, _)) = listener.accept().await else { continue };
        let mut request = Vec::new();
        let mut buffer = [0u8; 2048];
        // Only the request line matters; stop at the end of the headers.
        while request.len() < 16 * 1024 && !request.windows(4).any(|w| w == b"\r\n\r\n") {
            match tokio::time::timeout(Duration::from_secs(5), stream.read(&mut buffer)).await {
                Ok(Ok(n)) if n > 0 => request.extend_from_slice(&buffer[..n]),
                _ => break,
            }
        }
        let line = String::from_utf8_lossy(&request).lines().next().unwrap_or_default().to_owned();
        let target = line.split(' ').nth(1).unwrap_or_default();
        let Some(result) = callback_result(target) else {
            let _ = stream
                .write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
                .await;
            continue;
        };
        let page = match &result {
            Ok(_) => callback_page("You're signed in", "You can close this tab and go back to prepcode."),
            Err(message) => callback_page(
                "Sign-in didn't finish",
                &format!("{message} Go back to prepcode to try again."),
            ),
        };
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{page}",
            page.len()
        );
        let _ = stream.write_all(response.as_bytes()).await;
        let _ = stream.shutdown().await;
        return result;
    }
}

/// Reads the code (or the backend's error) from the callback's request
/// target, e.g. `/auth/callback?code=…`. None for any other path.
fn callback_result(target: &str) -> Option<Result<String, String>> {
    let url = Url::parse(&format!("http://127.0.0.1{target}")).ok()?;
    if url.path() != CALLBACK_PATH {
        return None;
    }
    let param =
        |name: &str| url.query_pairs().find(|(key, _)| key == name).map(|(_, value)| value.into_owned());
    Some(match (param("code"), param("error_description").or_else(|| param("error"))) {
        (Some(code), _) if !code.is_empty() => Ok(code),
        (_, Some(error)) => Err(format!("{}.", error.trim_end_matches('.'))),
        _ => Err("The browser came back without a sign-in.".into()),
    })
}

fn callback_page(title: &str, message: &str) -> String {
    let escape = |text: &str| text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;");
    format!(
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>prepcode</title>\
         <style>body{{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0;\
         color:#18181b;background:#fafafa}}@media(prefers-color-scheme:dark){{body{{color:#fafafa;background:#09090b}}}}\
         main{{max-width:28rem;padding:1.5rem;text-align:center}}h1{{font-size:1.25rem}}p{{opacity:.7}}</style></head>\
         <body><main><h1>{}</h1><p>{}</p></main></body></html>",
        escape(title),
        escape(message)
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pkce_challenge_is_the_verifiers_sha256() {
        let pair = pkce().unwrap();
        assert_eq!(pair.verifier.len(), 43);
        assert_eq!(pair.challenge, URL_SAFE_NO_PAD.encode(Sha256::digest(pair.verifier.as_bytes())));
        assert_ne!(pkce().unwrap().verifier, pair.verifier);
    }

    #[test]
    fn reads_the_callback() {
        assert_eq!(callback_result("/auth/callback?code=abc-123"), Some(Ok("abc-123".into())));
        assert_eq!(
            callback_result("/auth/callback?error=access_denied&error_description=The+user+denied+access"),
            Some(Err("The user denied access.".into()))
        );
        assert_eq!(
            callback_result("/auth/callback"),
            Some(Err("The browser came back without a sign-in.".into()))
        );
        assert_eq!(callback_result("/favicon.ico"), None);
        assert_eq!(callback_result("/auth/callback/../x?code=1"), None);
    }
}
