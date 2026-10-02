//! Talking to GitHub: signing in with the device flow, and (for syncing) the
//! REST API.
//!
//! prepcode is a GitHub OAuth App. Its client ID isn't a secret: the device
//! flow needs no client secret, which is why it suits a desktop app that
//! anyone can read the source of. The app asks for `public_repo`, enough to
//! create and write the student's public `prepcode-programs` repo.

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
    NotFound,
    /// GitHub understood but refused (e.g. a push that isn't a fast-forward).
    Rejected { status: u16, message: String },
    /// Anything else, with a message for the student.
    Other(String),
}

impl GitHubError {
    pub fn message(&self) -> String {
        match self {
            GitHubError::Offline => "Could not reach GitHub. Check your internet connection.".into(),
            GitHubError::Unauthorized => "Your GitHub sign-in has expired. Please sign in again.".into(),
            GitHubError::NotFound => "GitHub couldn't find that.".into(),
            GitHubError::Rejected { status, message } => {
                format!("GitHub refused the request: {message} ({status})")
            }
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
    if status == StatusCode::NOT_FOUND {
        return Err(GitHubError::NotFound);
    }
    if status.is_server_error() {
        return Err(GitHubError::Offline);
    }
    let body: Value = response.json().await.unwrap_or(Value::Null);
    let message = body["message"].as_str().unwrap_or("Unexpected response").to_owned();
    Err(GitHubError::Rejected { status: status.as_u16(), message })
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

/// A REST API request as the signed-in student.
fn api(method: reqwest::Method, path: &str, token: &str) -> Result<RequestBuilder, GitHubError> {
    Ok(client()?
        .request(method, format!("{API}{path}"))
        .bearer_auth(token)
        .header("X-GitHub-Api-Version", "2022-11-28"))
}

fn get(path: &str, token: &str) -> Result<RequestBuilder, GitHubError> {
    api(reqwest::Method::GET, path, token)
}

fn post(path: &str, token: &str, body: Value) -> Result<RequestBuilder, GitHubError> {
    Ok(api(reqwest::Method::POST, path, token)?.json(&body))
}

pub async fn user(token: &str) -> Result<User, GitHubError> {
    json(send(get("/user", token)?).await?).await
}

/// The student's repo, which prepcode syncs with.
pub const REPO: &str = "prepcode-programs";

#[derive(Deserialize)]
pub struct Repo {
    pub default_branch: String,
    pub html_url: String,
}

pub async fn get_repo(token: &str, owner: &str) -> Result<Option<Repo>, GitHubError> {
    match send(get(&format!("/repos/{owner}/{REPO}"), token)?).await {
        Ok(response) => json(response).await.map(Some),
        Err(GitHubError::NotFound) => Ok(None),
        Err(e) => Err(e),
    }
}

pub async fn create_repo(token: &str) -> Result<Repo, GitHubError> {
    let body = json!({
        "name": REPO,
        "description": "My programs, saved from prepcode",
        "private": false,
        // Starts the repo with a README, so it has a branch to commit to.
        "auto_init": true,
    });
    json(send(post("/user/repos", token, body)?).await?).await
}

/// The commit the branch points at, or None if the repo has no commits yet.
pub async fn branch_head(token: &str, owner: &str, branch: &str) -> Result<Option<String>, GitHubError> {
    let path = format!("/repos/{owner}/{REPO}/git/ref/heads/{branch}");
    match send(get(&path, token)?).await {
        Ok(response) => {
            let body: Value = json(response).await?;
            Ok(body["object"]["sha"].as_str().map(str::to_owned))
        }
        // An empty repo answers 409 "Git Repository is empty".
        Err(GitHubError::NotFound) | Err(GitHubError::Rejected { status: 409, .. }) => Ok(None),
        Err(e) => Err(e),
    }
}

/// Adds one file with the contents API, which (unlike the Git data API) also
/// works on an empty repo.
pub async fn create_file(token: &str, owner: &str, path: &str, content: &str, message: &str) -> Result<(), GitHubError> {
    use base64::Engine;
    let body = json!({
        "message": message,
        "content": base64::engine::general_purpose::STANDARD.encode(content),
    });
    let request = api(reqwest::Method::PUT, &format!("/repos/{owner}/{REPO}/contents/{path}"), token)?.json(&body);
    send(request).await.map(|_| ())
}

pub async fn commit_tree(token: &str, owner: &str, commit: &str) -> Result<String, GitHubError> {
    let body: Value = json(send(get(&format!("/repos/{owner}/{REPO}/git/commits/{commit}"), token)?).await?).await?;
    body["tree"]["sha"]
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| GitHubError::Other("Unexpected response from GitHub: no tree".into()))
}

/// A file in a tree: its path and blob sha.
#[derive(Deserialize)]
pub struct TreeEntry {
    pub path: String,
    pub sha: String,
    #[serde(rename = "type")]
    pub kind: String,
}

/// Every file and folder in a tree, recursively.
pub async fn tree(token: &str, owner: &str, tree: &str) -> Result<Vec<TreeEntry>, GitHubError> {
    #[derive(Deserialize)]
    struct Tree {
        tree: Vec<TreeEntry>,
    }
    let path = format!("/repos/{owner}/{REPO}/git/trees/{tree}?recursive=1");
    Ok(json::<Tree>(send(get(&path, token)?).await?).await?.tree)
}

pub async fn blob(token: &str, owner: &str, sha: &str) -> Result<Vec<u8>, GitHubError> {
    use base64::Engine;
    let body: Value = json(send(get(&format!("/repos/{owner}/{REPO}/git/blobs/{sha}"), token)?).await?).await?;
    // Base64 with line breaks every 60 characters.
    let encoded: String = body["content"].as_str().unwrap_or_default().split_whitespace().collect();
    base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| GitHubError::Other(format!("Could not read a file from GitHub: {e}")))
}

/// A new tree: `base` with `entries` added, changed or (with a null sha) removed.
pub async fn create_tree(token: &str, owner: &str, base: &str, entries: Vec<Value>) -> Result<String, GitHubError> {
    let body = json!({ "base_tree": base, "tree": entries });
    let created: Value = json(send(post(&format!("/repos/{owner}/{REPO}/git/trees"), token, body)?).await?).await?;
    created["sha"]
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| GitHubError::Other("Unexpected response from GitHub: no tree".into()))
}

pub async fn create_commit(token: &str, owner: &str, message: &str, tree: &str, parent: &str) -> Result<String, GitHubError> {
    let body = json!({ "message": message, "tree": tree, "parents": [parent] });
    let created: Value = json(send(post(&format!("/repos/{owner}/{REPO}/git/commits"), token, body)?).await?).await?;
    created["sha"]
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| GitHubError::Other("Unexpected response from GitHub: no commit".into()))
}

/// Moves the branch to `commit`. Returns false if the branch moved meanwhile
/// (someone pushed from another computer), so the caller can pull and retry.
pub async fn update_branch(token: &str, owner: &str, branch: &str, commit: &str) -> Result<bool, GitHubError> {
    let body = json!({ "sha": commit, "force": false });
    let path = format!("/repos/{owner}/{REPO}/git/refs/heads/{branch}");
    match send(api(reqwest::Method::PATCH, &path, token)?.json(&body)).await {
        Ok(_) => Ok(true),
        Err(GitHubError::Rejected { status: 422, .. }) => Ok(false),
        Err(e) => Err(e),
    }
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
