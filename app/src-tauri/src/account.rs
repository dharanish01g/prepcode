//! Talking to the account system: Supabase Auth in the prepwisely project,
//! which prepcode (students) and prepwisely (staff) share.
//!
//! A student signs in with GitHub in their browser, through Supabase. The
//! browser then comes back to a one-off address on this computer,
//! `http://127.0.0.1:<free port>/auth/callback`, with a one-time code. The
//! code only works together with a PKCE verifier that never leaves this
//! process, so another program catching it can't use it. Only a GitHub
//! sign-in can create an account (a Supabase hook refuses the rest).

use std::sync::OnceLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use reqwest::{RequestBuilder, Url};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

const SUPABASE: &str = "https://gjlynpdgovgyyklamtds.supabase.co";
/// Public by design, like the content project's key in `lib/supabase.ts`.
const PUBLISHABLE_KEY: &str = "sb_publishable_w2bnVW8VQGr5BbV88Xdbcg_IzYGzFVX";
const CALLBACK_PATH: &str = "/auth/callback";

fn client() -> Result<&'static reqwest::Client, AccountError> {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    if let Some(client) = CLIENT.get() {
        return Ok(client);
    }
    let client = reqwest::Client::builder()
        .user_agent("prepcode")
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| AccountError::Other(format!("Could not reach prepcode's servers: {e}")))?;
    Ok(CLIENT.get_or_init(|| client))
}

/// Why a request to the account system didn't work.
pub enum AccountError {
    /// No connection, a timeout, or the server is down: try again later.
    Offline,
    /// The account system refused, e.g. a used code or too many requests.
    Rejected(String),
    /// The session is over for good (signed out, deleted, or its refresh
    /// token already used): only this means "sign in again".
    SignedOut(String),
    /// The student's GitHub isn't set up for syncing yet: no
    /// `prepcode-programs` repo, or the prepcodes app has no access to it.
    NotSetUp(String),
    Other(String),
}

impl AccountError {
    pub fn message(&self) -> String {
        match self {
            AccountError::Offline => {
                "Could not reach prepcode's servers. Check your internet connection.".into()
            }
            AccountError::Rejected(message)
            | AccountError::SignedOut(message)
            | AccountError::NotSetUp(message)
            | AccountError::Other(message) => message.clone(),
        }
    }
}

// By hand, so a token never ends up in a log.
impl std::fmt::Debug for AccountError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AccountError::Offline => write!(f, "Offline"),
            AccountError::Rejected(message) => write!(f, "Rejected({message:?})"),
            AccountError::SignedOut(message) => write!(f, "SignedOut({message:?})"),
            AccountError::NotSetUp(message) => write!(f, "NotSetUp({message:?})"),
            AccountError::Other(message) => write!(f, "Other({message:?})"),
        }
    }
}

/// The signed-in student, as saved on this computer.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Account {
    /// The Supabase account id.
    pub id: String,
    /// Never changes, unlike `github_login`, so it names the student's folder.
    pub github_id: u64,
    pub github_login: String,
    pub avatar_url: Option<String>,
    /// The Google account connected for signing in (Profile → Gmail), if any.
    #[serde(default)]
    pub google: Option<LinkedIdentity>,
}

/// A second way to sign in, linked to the account.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct LinkedIdentity {
    /// Supabase's id for the link, needed to remove it.
    pub identity_id: String,
    pub email: Option<String>,
}

/// The providers a student can sign in with. Only GitHub creates an account
/// (a Supabase hook refuses new accounts from the others).
#[derive(Clone, Copy)]
pub enum Provider {
    GitHub,
    Google,
}

impl Provider {
    fn id(self) -> &'static str {
        match self {
            Provider::GitHub => "github",
            Provider::Google => "google",
        }
    }
}

/// A signed-in session. Syncing gets short-lived repo tokens another way, so
/// GitHub's and Google's own tokens, which Supabase also sends back, are never
/// saved.
pub struct Tokens {
    /// Valid for an hour; only ever kept in memory.
    pub access_token: String,
    /// Keeps the student signed in. Each one works once: save the new one.
    pub refresh_token: String,
    /// Unix seconds.
    pub expires_at: u64,
    /// The Supabase account id.
    pub user_id: String,
    pub email: Option<String>,
    /// None while the account has no GitHub yet (it started with Google).
    pub account: Option<Account>,
    /// The token of the GitHub or Google login just used in the browser (None
    /// after a refresh). A GitHub one is used once, right after signing in, to
    /// find or create the student's repo (see `sync::repo_setup`).
    pub provider_token: Option<String>,
}

// --- Signing in -----------------------------------------------------------------------

/// The PKCE pair for one sign-in: the challenge goes to Supabase now, the
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

/// Where the browser goes to sign in with `provider`, coming back to `port`.
pub fn authorize_url(provider: Provider, port: u16, challenge: &str) -> String {
    Url::parse_with_params(
        &format!("{SUPABASE}/auth/v1/authorize"),
        browser_params(provider, port, challenge),
    )
    .map(String::from)
    .unwrap_or_default()
}

/// Where the browser goes to connect `provider` to the signed-in account, as
/// another way to sign in. It comes back to `port` like a sign-in does.
pub async fn link_url(
    access_token: &str,
    provider: Provider,
    port: u16,
    challenge: &str,
) -> Result<String, AccountError> {
    let mut params = browser_params(provider, port, challenge).to_vec();
    params.push(("skip_http_redirect", "true".into()));
    let url = Url::parse_with_params(&format!("{SUPABASE}/auth/v1/user/identities/authorize"), params)
        .map_err(|e| AccountError::Other(e.to_string()))?;
    let request = client()?.get(url).header("apikey", PUBLISHABLE_KEY).bearer_auth(access_token);
    let body = send(request).await?;
    body["url"]
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| AccountError::Other("Unexpected answer from prepcode's servers: no link".into()))
}

fn browser_params(provider: Provider, port: u16, challenge: &str) -> [(&'static str, String); 4] {
    [
        ("provider", provider.id().into()),
        ("redirect_to", format!("http://127.0.0.1:{port}{CALLBACK_PATH}")),
        ("code_challenge", challenge.into()),
        ("code_challenge_method", "s256".into()),
    ]
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

/// Reads the code (or Supabase's error) from the callback's request target,
/// e.g. `/auth/callback?code=…`. None for any other path.
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

/// Swaps the one-time code from the browser for a session.
pub async fn exchange_code(code: &str, verifier: &str) -> Result<Tokens, AccountError> {
    let body = json!({ "auth_code": code, "code_verifier": verifier });
    tokens(send(post("/auth/v1/token?grant_type=pkce")?.json(&body)).await?)
}

/// A new session from a saved refresh token. Only SignedOut means the student
/// must sign in again (signed out elsewhere, or the token was already used);
/// any other error leaves the saved sign-in as it is.
pub async fn refresh(refresh_token: &str) -> Result<Tokens, AccountError> {
    let body = json!({ "refresh_token": refresh_token });
    tokens(send(post("/auth/v1/token?grant_type=refresh_token")?.json(&body)).await?)
}

/// The signed-in account as the server has it now.
pub async fn user(access_token: &str) -> Result<Account, AccountError> {
    let request = client()?.get(format!("{SUPABASE}/auth/v1/user")).header("apikey", PUBLISHABLE_KEY);
    let body = send(request.bearer_auth(access_token)).await?;
    account_of(&body).ok_or_else(|| {
        AccountError::Other("Unexpected answer from prepcode's servers: no GitHub account".into())
    })
}

/// The roles of the signed-in account (staff roles, "faculty", "tpo",
/// "student"), from the same function prepwisely uses.
pub async fn role_ids(access_token: &str) -> Result<Vec<String>, AccountError> {
    let body = send(post("/rest/v1/rpc/my_role_ids")?.bearer_auth(access_token).json(&json!({}))).await?;
    Ok(body.as_array().into_iter().flatten().filter_map(|role| role.as_str().map(str::to_owned)).collect())
}

/// Deletes the signed-in account while it's still waiting for GitHub (see
/// the `discard-pending-account` function), freeing its Google login.
pub async fn discard_waiting(access_token: &str) -> Result<(), AccountError> {
    let request = post("/functions/v1/discard-pending-account")?.bearer_auth(access_token).json(&json!({}));
    send(request).await.map(|_| ())
}

/// Removes a linked way to sign in (GitHub, which made the account, stays).
pub async fn unlink(access_token: &str, identity_id: &str) -> Result<(), AccountError> {
    let request = client()?
        .delete(format!("{SUPABASE}/auth/v1/user/identities/{identity_id}"))
        .header("apikey", PUBLISHABLE_KEY)
        .bearer_auth(access_token);
    send(request).await.map(|_| ())
}

/// Ends this session on the server (other computers stay signed in).
pub async fn sign_out(access_token: &str) -> Result<(), AccountError> {
    send(post("/auth/v1/logout?scope=local")?.bearer_auth(access_token)).await.map(|_| ())
}

// --- Syncing ----------------------------------------------------------------------------

/// Sync errors that the student fixes on GitHub start with this, so the app
/// can offer a button to the prepcodes install page.
pub const CONNECT_GITHUB: &str = "Connect GitHub:";

/// A GitHub token for the student's `prepcode-programs` repo, and nothing
/// else, from the `github-token` function. It works for an hour.
#[derive(Clone)]
pub struct RepoToken {
    pub token: String,
    /// Unix seconds.
    pub expires_at: u64,
    pub github_login: String,
}

pub async fn repo_token(access_token: &str) -> Result<RepoToken, AccountError> {
    let request = post("/functions/v1/github-token")?.bearer_auth(access_token).json(&json!({}));
    let response = request.send().await.map_err(|_| AccountError::Offline)?;
    let status = response.status().as_u16();
    let body: Value = response.json().await.unwrap_or(Value::Null);
    let rejected = |message: String| Err(AccountError::Rejected(message));
    match (status, body["code"].as_str()) {
        (200, _) => {}
        // The prepcodes app isn't installed, or doesn't have the repo (which
        // may not exist yet).
        (_, Some("not_installed" | "repo_not_selected")) => {
            return Err(AccountError::NotSetUp(format!(
                "{CONNECT_GITHUB} give prepcode access to your prepcode-programs repository on GitHub."
            )))
        }
        (_, Some("no_github")) => return rejected("This account has no GitHub sign-in.".into()),
        (401, _) => return rejected("Your sign-in has expired. Log out and sign in again.".into()),
        (500.., _) => return Err(AccountError::Offline),
        _ => {
            let message = body["error"].as_str().unwrap_or("Could not get access to your GitHub repository.");
            return rejected(message.to_owned());
        }
    }
    let field = |key: &str| body[key].as_str().map(str::to_owned);
    let unexpected =
        || AccountError::Other("Unexpected answer from prepcode's servers: no GitHub token".into());
    let expires_at = field("expires_at")
        .as_deref()
        .and_then(crate::github::parse_time)
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .ok_or_else(unexpected)?
        .as_secs();
    Ok(RepoToken {
        token: field("token").ok_or_else(unexpected)?,
        expires_at,
        github_login: field("github_login").ok_or_else(unexpected)?,
    })
}

fn post(path: &str) -> Result<RequestBuilder, AccountError> {
    Ok(client()?.post(format!("{SUPABASE}{path}")).header("apikey", PUBLISHABLE_KEY))
}

async fn send(request: RequestBuilder) -> Result<Value, AccountError> {
    let response = request.send().await.map_err(|_| AccountError::Offline)?;
    let status = response.status();
    let body: Value = response.json().await.unwrap_or(Value::Null);
    if status.is_success() {
        return Ok(body);
    }
    Err(error_of(status, &body))
}

/// What a failed answer from the account system means.
fn error_of(status: reqwest::StatusCode, body: &Value) -> AccountError {
    if status.is_server_error() || status == reqwest::StatusCode::REQUEST_TIMEOUT {
        return AccountError::Offline;
    }
    // A college lab shares one internet address, so many PCs signing in at
    // once can hit Supabase's per-address limits.
    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        return AccountError::Rejected(
            "Too many sign-ins from this network right now. Please try again in a few minutes.".into(),
        );
    }
    let message = ["msg", "error_description", "message", "error"]
        .iter()
        .find_map(|key| body[*key].as_str())
        .unwrap_or("The sign-in didn't work. Please try again.")
        .to_owned();
    if body["error_code"].as_str().is_some_and(|code| SIGNED_OUT_CODES.contains(&code)) {
        return AccountError::SignedOut(message);
    }
    AccountError::Rejected(message)
}

/// Supabase's `error_code`s for a session that can never be used again.
const SIGNED_OUT_CODES: &[&str] = &[
    "refresh_token_not_found",
    "refresh_token_already_used",
    "session_not_found",
    "session_expired",
    "user_not_found",
    "user_banned",
];

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: String,
    expires_in: u64,
    expires_at: Option<u64>,
    user: Value,
    provider_token: Option<String>,
}

fn tokens(body: Value) -> Result<Tokens, AccountError> {
    let unexpected =
        |what: &str| AccountError::Other(format!("Unexpected answer from prepcode's servers: {what}"));
    let response: TokenResponse = serde_json::from_value(body).map_err(|_| unexpected("no session"))?;
    let user_id = response.user["id"].as_str().ok_or_else(|| unexpected("no account"))?.to_owned();
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    Ok(Tokens {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_at: response.expires_at.unwrap_or(now + response.expires_in),
        user_id,
        email: response.user["email"].as_str().map(str::to_owned),
        account: account_of(&response.user),
        provider_token: response.provider_token.filter(|token| !token.is_empty()),
    })
}

/// The account's details from Supabase's user object, via its GitHub identity.
fn account_of(user: &Value) -> Option<Account> {
    let id = user["id"].as_str()?.to_owned();
    let identity = user["identities"].as_array()?.iter().find(|i| i["provider"] == "github")?;
    let data = &identity["identity_data"];
    let github_id = [&data["provider_id"], &data["sub"], &identity["id"]]
        .iter()
        .find_map(|value| value.as_str().and_then(|s| s.parse().ok()).or_else(|| value.as_u64()))?;
    let github_login = data["user_name"].as_str().or_else(|| data["preferred_username"].as_str())?.to_owned();
    let avatar_url = data["avatar_url"].as_str().map(str::to_owned);
    let google =
        user["identities"].as_array()?.iter().find(|i| i["provider"] == "google").and_then(|identity| {
            Some(LinkedIdentity {
                identity_id: identity["identity_id"].as_str()?.to_owned(),
                email: identity["identity_data"]["email"]
                    .as_str()
                    .or_else(|| identity["email"].as_str())
                    .map(str::to_owned),
            })
        });
    Some(Account { id, github_id, github_login, avatar_url, google })
}

#[cfg(test)]
mod tests {
    use serde_json::json;

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

    #[test]
    fn only_a_dead_session_signs_out() {
        use reqwest::StatusCode;
        // As Supabase answers an unknown refresh token.
        let gone = json!({
            "code": 400,
            "error_code": "refresh_token_not_found",
            "msg": "Invalid Refresh Token: Refresh Token Not Found"
        });
        assert!(matches!(error_of(StatusCode::BAD_REQUEST, &gone), AccountError::SignedOut(_)));
        let limited = json!({ "code": 429, "error_code": "over_request_rate_limit", "msg": "Rate limit" });
        assert!(matches!(error_of(StatusCode::TOO_MANY_REQUESTS, &limited), AccountError::Rejected(_)));
        assert!(matches!(error_of(StatusCode::BAD_GATEWAY, &Value::Null), AccountError::Offline));
        assert!(matches!(error_of(StatusCode::FORBIDDEN, &Value::Null), AccountError::Rejected(_)));
    }

    #[test]
    fn authorize_url_returns_to_this_computer() {
        let url = Url::parse(&authorize_url(Provider::GitHub, 51234, "challenge")).unwrap();
        let param = |name: &str| url.query_pairs().find(|(k, _)| k == name).map(|(_, v)| v.into_owned());
        assert_eq!(url.path(), "/auth/v1/authorize");
        assert_eq!(param("provider").as_deref(), Some("github"));
        assert_eq!(param("redirect_to").as_deref(), Some("http://127.0.0.1:51234/auth/callback"));
        assert_eq!(param("code_challenge_method").as_deref(), Some("s256"));
    }

    #[test]
    fn reads_the_github_identity() {
        // Trimmed from a real sign-in.
        let user = json!({
            "id": "09e5b38b-348b-4f2a-98da-71eaaba9a3ec",
            "email": "student@example.com",
            "identities": [{
                "id": "323292969",
                "provider": "github",
                "identity_data": {
                    "avatar_url": "https://avatars.githubusercontent.com/u/323292969?v=4",
                    "provider_id": "323292969",
                    "sub": "323292969",
                    "user_name": "dharanish01g"
                }
            }]
        });
        assert_eq!(
            account_of(&user),
            Some(Account {
                id: "09e5b38b-348b-4f2a-98da-71eaaba9a3ec".into(),
                github_id: 323292969,
                github_login: "dharanish01g".into(),
                avatar_url: Some("https://avatars.githubusercontent.com/u/323292969?v=4".into()),
                google: None,
            })
        );
        assert_eq!(account_of(&json!({ "id": "x", "identities": [{ "provider": "email" }] })), None);
    }

    #[test]
    fn reads_a_linked_google_account() {
        let user = json!({
            "id": "09e5b38b-348b-4f2a-98da-71eaaba9a3ec",
            "identities": [
                { "provider": "github", "identity_data": { "provider_id": "323292969", "user_name": "dharanish01g" } },
                {
                    "identity_id": "5f0c2a1e-0000-4000-8000-000000000001",
                    "provider": "google",
                    "identity_data": { "email": "student@gmail.com", "sub": "1093" }
                }
            ]
        });
        let google = account_of(&user).unwrap().google.unwrap();
        assert_eq!(google.identity_id, "5f0c2a1e-0000-4000-8000-000000000001");
        assert_eq!(google.email.as_deref(), Some("student@gmail.com"));
    }
}
