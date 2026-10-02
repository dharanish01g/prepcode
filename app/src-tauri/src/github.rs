//! Talking to GitHub: signing in with the device flow, and (for syncing) the
//! REST API.
//!
//! prepcode is a GitHub OAuth App. Its client ID isn't a secret: the device
//! flow needs no client secret, which is why it suits a desktop app that
//! anyone can read the source of. The app asks for `public_repo`, enough to
//! create and write the student's public `prepcode` repo.

use std::sync::OnceLock;
use std::time::Duration;

use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, USER_AGENT};
use reqwest::{RequestBuilder, Response, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

/// prepcode's OAuth App (github.com/settings/developers), with device flow on.
const CLIENT_ID: &str = "Ov23liaNtg95eH6OmyHG";
const SCOPE: &str = "public_repo";
const API: &str = "https://api.github.com";

fn client() -> Result<&'static reqwest::Client, GitHubError> {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    if let Some(client) = CLIENT.get() {
        return Ok(client);
    }
    let mut headers = HeaderMap::new();
    // GitHub rejects API requests without a User-Agent.
    headers.insert(USER_AGENT, HeaderValue::from_static("prepcode"));
    headers.insert(ACCEPT, HeaderValue::from_static("application/json"));
    let client = reqwest::Client::builder()
        .default_headers(headers)
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| GitHubError::Other(format!("Could not reach GitHub: {e}")))?;
    Ok(CLIENT.get_or_init(|| client))
}

/// Why a request to GitHub didn't work.
#[derive(Debug, PartialEq)]
pub enum GitHubError {
    /// No connection, a timeout, or GitHub is down: try again later.
    Offline,
    /// The sign-in was revoked (or never valid): the student must sign in again.
    Unauthorized,
    /// Anything else, with a message for the student.
    Other(String),
}

impl GitHubError {
    pub fn message(&self) -> String {
        match self {
            GitHubError::Offline => "Could not reach GitHub. Check your internet connection.".into(),
            GitHubError::Unauthorized => "Your GitHub sign-in has expired. Please sign in again.".into(),
            GitHubError::Other(message) => message.clone(),
        }
    }
}

/// Sends `request`, returning the response only if it succeeded.
async fn send(request: RequestBuilder) -> Result<Response, GitHubError> {
    let response = request.send().await.map_err(|_| GitHubError::Offline)?;
    let status = response.status();
    if status.is_success() {
        return Ok(response);
    }
    if status == StatusCode::UNAUTHORIZED {
        return Err(GitHubError::Unauthorized);
    }
    if status.is_server_error() {
        return Err(GitHubError::Offline);
    }
    let body: Value = response.json().await.unwrap_or(Value::Null);
    let message = body["message"].as_str().unwrap_or("Unexpected response");
    Err(GitHubError::Other(format!("GitHub refused the request: {message} ({status})")))
}

async fn json<T: for<'de> Deserialize<'de>>(response: Response) -> Result<T, GitHubError> {
    response
        .json()
        .await
        .map_err(|e| GitHubError::Other(format!("Unexpected response from GitHub: {e}")))
}

// --- Device flow sign-in -----------------------------------------------------

/// The code the student types at `verification_uri` to approve prepcode.
#[derive(Clone, Deserialize, Serialize)]
pub struct DeviceCode {
    /// Identifies this sign-in when polling; never shown.
    #[serde(skip_serializing)]
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    /// Seconds until the code stops working.
    pub expires_in: u64,
    /// Seconds to wait between polls.
    pub interval: u64,
}

pub async fn request_device_code() -> Result<DeviceCode, GitHubError> {
    let request = client()?
        .post("https://github.com/login/device/code")
        .json(&json!({ "client_id": CLIENT_ID, "scope": SCOPE }));
    json(send(request).await?).await
}

/// Where a device-flow sign-in is up to.
pub enum Poll {
    /// The student hasn't approved yet.
    Pending,
    /// Polling too fast: wait longer between polls.
    SlowDown,
    Expired,
    Denied,
    Approved(String),
}

pub async fn poll_for_token(device_code: &str) -> Result<Poll, GitHubError> {
    let request = client()?.post("https://github.com/login/oauth/access_token").json(&json!({
        "client_id": CLIENT_ID,
        "device_code": device_code,
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
    }));
    // Errors come back as 200 with an "error" field.
    let body: Value = json(send(request).await?).await?;
    if let Some(token) = body["access_token"].as_str() {
        return Ok(Poll::Approved(token.to_owned()));
    }
    match body["error"].as_str().unwrap_or_default() {
        "authorization_pending" => Ok(Poll::Pending),
        "slow_down" => Ok(Poll::SlowDown),
        "expired_token" => Ok(Poll::Expired),
        "access_denied" => Ok(Poll::Denied),
        other => Err(GitHubError::Other(format!("GitHub sign-in failed: {other}"))),
    }
}

// --- REST API ------------------------------------------------------------------

/// The signed-in GitHub account.
#[derive(Clone, Deserialize, Serialize)]
pub struct User {
    /// Never changes, unlike `login`, so it names the student's folder.
    pub id: u64,
    pub login: String,
    pub avatar_url: Option<String>,
}

pub async fn user(token: &str) -> Result<User, GitHubError> {
    let request = client()?
        .get(format!("{API}/user"))
        .bearer_auth(token)
        .header("X-GitHub-Api-Version", "2022-11-28");
    json(send(request).await?).await
}

#[cfg(test)]
mod tests {
    #[test]
    #[ignore = "needs the network"]
    fn gets_a_device_code() {
        let code = tauri::async_runtime::block_on(super::request_device_code()).unwrap();
        assert!(code.verification_uri.starts_with("https://github.com/"));
        assert!(code.user_code.contains('-'));
    }
}
