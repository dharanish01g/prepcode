//! Talking to GitHub's REST API, for syncing a student's `prepcode-programs`
//! repo. Signing in goes through the account system instead (account.rs).

use std::sync::OnceLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, USER_AGENT};
use reqwest::{RequestBuilder, Response, StatusCode};
use serde::Deserialize;
use serde_json::{json, Value};

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
    Rejected {
        status: u16,
        message: String,
    },
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
    response.json().await.map_err(|e| GitHubError::Other(format!("Unexpected response from GitHub: {e}")))
}

// --- REST API ------------------------------------------------------------------

/// Who a commit is credited to: the student, by their GitHub noreply
/// address, so it counts on their GitHub profile even though the prepcodes app
/// makes it.
pub struct Author {
    name: String,
    email: String,
}

impl Author {
    pub fn student(github_id: u64, login: &str) -> Self {
        Author { name: login.to_owned(), email: format!("{github_id}+{login}@users.noreply.github.com") }
    }

    fn json(&self) -> Value {
        json!({ "name": self.name, "email": self.email })
    }
}

/// A REST API request with a token for the student's repo.
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

/// The student's repo, which prepcode syncs with.
pub const REPO: &str = "prepcode-programs";

#[derive(Deserialize)]
pub struct Repo {
    pub id: u64,
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

/// The id of `owner`'s `prepcode-programs` repo, if it exists: with the
/// student's own GitHub token if there is one, else without signing in (it's a
/// public repo).
pub async fn find_repo(token: Option<&str>, owner: &str) -> Result<Option<u64>, GitHubError> {
    let request =
        client()?.get(format!("{API}/repos/{owner}/{REPO}")).header("X-GitHub-Api-Version", "2022-11-28");
    let request = match token {
        Some(token) => request.bearer_auth(token),
        None => request,
    };
    match send(request).await {
        Ok(response) => json::<Repo>(response).await.map(|repo| Some(repo.id)),
        Err(GitHubError::NotFound) => Ok(None),
        Err(e) => Err(e),
    }
}

/// Creates the student's public `prepcode-programs` repo with their own GitHub
/// token (needs the prepcodes app's "Repository creation" permission), and
/// returns its id. It starts with a README, so it's never empty.
pub async fn create_repo(token: &str) -> Result<u64, GitHubError> {
    let body = json!({
        "name": REPO,
        "description": "Programs saved from prepcode",
        "private": false,
        "auto_init": true,
    });
    let repo: Repo = json(send(post("/user/repos", token, body)?).await?).await?;
    Ok(repo.id)
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
pub async fn create_file(
    token: &str,
    owner: &str,
    path: &str,
    content: &str,
    message: &str,
    author: &Author,
) -> Result<(), GitHubError> {
    use base64::Engine;
    let body = json!({
        "message": message,
        "content": base64::engine::general_purpose::STANDARD.encode(content),
        "author": author.json(),
    });
    let request =
        api(reqwest::Method::PUT, &format!("/repos/{owner}/{REPO}/contents/{path}"), token)?.json(&body);
    send(request).await.map(|_| ())
}

pub async fn commit_tree(token: &str, owner: &str, commit: &str) -> Result<String, GitHubError> {
    let body: Value =
        json(send(get(&format!("/repos/{owner}/{REPO}/git/commits/{commit}"), token)?).await?).await?;
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
    let body: Value =
        json(send(get(&format!("/repos/{owner}/{REPO}/git/blobs/{sha}"), token)?).await?).await?;
    // Base64 with line breaks every 60 characters.
    let encoded: String = body["content"].as_str().unwrap_or_default().split_whitespace().collect();
    base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| GitHubError::Other(format!("Could not read a file from GitHub: {e}")))
}

/// When `path` last changed: the date of the newest commit on the default
/// branch that touched it. None if GitHub has no such commit or an odd date.
pub async fn last_changed(token: &str, owner: &str, path: &str) -> Result<Option<SystemTime>, GitHubError> {
    // Program paths are plain ASCII (see sync::is_program_path), so no escaping.
    let url = format!("/repos/{owner}/{REPO}/commits?path={path}&per_page=1");
    let body: Value = json(send(get(&url, token)?).await?).await?;
    Ok(body[0]["commit"]["committer"]["date"].as_str().and_then(parse_time))
}

/// GitHub's timestamps, always UTC like `2026-10-02T09:11:02Z`.
pub(crate) fn parse_time(text: &str) -> Option<SystemTime> {
    let b = text.as_bytes();
    let shape_ok = b.len() == 20
        && b[4] == b'-'
        && b[7] == b'-'
        && b[10] == b'T'
        && b[13] == b':'
        && b[16] == b':'
        && b[19] == b'Z';
    if !shape_ok {
        return None;
    }
    let num = |range: std::ops::Range<usize>| text.get(range)?.parse::<i64>().ok();
    let (year, month, day) = (num(0..4)?, num(5..7)?, num(8..10)?);
    let (hour, minute, second) = (num(11..13)?, num(14..16)?, num(17..19)?);
    if !(1..=12).contains(&month) || !(1..=31).contains(&day) || hour > 23 || minute > 59 || second > 60 {
        return None;
    }
    // Howard Hinnant's days-from-civil algorithm.
    let y = if month <= 2 { year - 1 } else { year };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let mp = (month + 9) % 12;
    let doy = (153 * mp + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146_097 + doe - 719_468;
    let secs = days * 86_400 + hour * 3600 + minute * 60 + second;
    Some(UNIX_EPOCH + Duration::from_secs(u64::try_from(secs).ok()?))
}

/// A new tree: `base` with `entries` added, changed or (with a null sha) removed.
pub async fn create_tree(
    token: &str,
    owner: &str,
    base: &str,
    entries: Vec<Value>,
) -> Result<String, GitHubError> {
    let body = json!({ "base_tree": base, "tree": entries });
    let created: Value =
        json(send(post(&format!("/repos/{owner}/{REPO}/git/trees"), token, body)?).await?).await?;
    created["sha"]
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| GitHubError::Other("Unexpected response from GitHub: no tree".into()))
}

pub async fn create_commit(
    token: &str,
    owner: &str,
    message: &str,
    tree: &str,
    parent: &str,
    author: &Author,
) -> Result<String, GitHubError> {
    let body = json!({ "message": message, "tree": tree, "parents": [parent], "author": author.json() });
    let created: Value =
        json(send(post(&format!("/repos/{owner}/{REPO}/git/commits"), token, body)?).await?).await?;
    created["sha"]
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| GitHubError::Other("Unexpected response from GitHub: no commit".into()))
}

/// Moves the branch to `commit`. Returns false if the branch moved meanwhile
/// (someone pushed from another computer), so the caller can pull and retry.
pub async fn update_branch(
    token: &str,
    owner: &str,
    branch: &str,
    commit: &str,
) -> Result<bool, GitHubError> {
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
    use std::time::{Duration, UNIX_EPOCH};

    use super::parse_time;

    #[test]
    fn parses_github_times() {
        // `date -u -d 2026-10-02T09:11:02Z +%s`
        assert_eq!(parse_time("2026-10-02T09:11:02Z"), Some(UNIX_EPOCH + Duration::from_secs(1_790_932_262)));
        assert_eq!(parse_time("1970-01-01T00:00:00Z"), Some(UNIX_EPOCH));
        // 2024-02-29 (leap day)
        assert_eq!(parse_time("2024-02-29T00:00:00Z"), Some(UNIX_EPOCH + Duration::from_secs(1_709_164_800)));
        assert_eq!(parse_time("2026-10-02T09:11:02+05:30"), None);
        assert_eq!(parse_time("2026-13-02T09:11:02Z"), None);
        assert_eq!(parse_time(""), None);
    }
}
