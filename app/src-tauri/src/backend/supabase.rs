//! The backend as Supabase: Auth, PostgREST and edge functions in prepcode's
//! project (shared by the student app and the staff tools), and Jobs in the
//! old project until its table moves.
//!
//! A student signs in with GitHub in their browser, through Supabase Auth.
//! Only a GitHub sign-in can create an account (a Supabase hook refuses the
//! rest). The content (Practice, Jobs) is read with the publishable key alone,
//! so guests can practise too; row level security decides what it returns.

use std::sync::OnceLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::{Method, RequestBuilder, Url};
use serde::de::DeserializeOwned;
use serde::Deserialize;
use serde_json::{json, Value};

use super::browser;
use super::{
    Account, Backend, BackendError, EmailCode, Job, LinkedIdentity, Mcq, McqEventRecord, Provider, Question,
    QuestionSummary, RepoToken, Section, SetupNeeded, Tokens,
};

/// A Supabase project. The publishable keys are public by design: they ship
/// in every copy of the app, and row level security decides what they can
/// read or write.
struct Project {
    url: &'static str,
    key: &'static str,
}

pub struct Supabase {
    /// Accounts, Practice and MCQ events.
    main: Project,
    /// Only Jobs, until its table moves to the main project.
    jobs: Project,
}

impl Supabase {
    pub const PREPCODE: Supabase = Supabase {
        main: Project {
            url: "https://gjlynpdgovgyyklamtds.supabase.co",
            key: "sb_publishable_w2bnVW8VQGr5BbV88Xdbcg_IzYGzFVX",
        },
        jobs: Project {
            url: "https://osprwlsbdioyejpbwcmj.supabase.co",
            key: "sb_publishable_gIBQhNZo4QFEdhQxdSgoYg_GmjWgIDP",
        },
    };

    /// A request to the main project, with its key.
    fn request(&self, method: Method, path: &str) -> Result<RequestBuilder, BackendError> {
        self.main.request(method, path)
    }

    fn post(&self, path: &str) -> Result<RequestBuilder, BackendError> {
        self.request(Method::POST, path)
    }
}

impl Project {
    fn request(&self, method: Method, path: &str) -> Result<RequestBuilder, BackendError> {
        Ok(client()?.request(method, format!("{}{path}", self.url)).header("apikey", self.key))
    }

    /// Reads rows from PostgREST: `table` with `query` (`select`, filters,
    /// `order`), as `T`. The `select` may be spread out with spaces for
    /// reading; they're taken out, as supabase-js does, since PostgREST
    /// can't parse some of them (e.g. `!inner (slug)`).
    async fn select<T: DeserializeOwned>(
        &self,
        table: &str,
        query: &[(&str, &str)],
    ) -> Result<T, BackendError> {
        let compact = |(key, value): &(&str, &str)| match *key {
            "select" => (key.to_string(), value.split_whitespace().collect::<String>()),
            _ => (key.to_string(), value.to_string()),
        };
        let url = Url::parse_with_params(&format!("{}/rest/v1/{table}", self.url), query.iter().map(compact))
            .map_err(|e| BackendError::Other(e.to_string()))?;
        let request = client()?.get(url).header("apikey", self.key);
        parse(send(request).await?)
    }
}

fn client() -> Result<&'static reqwest::Client, BackendError> {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    if let Some(client) = CLIENT.get() {
        return Ok(client);
    }
    let client = reqwest::Client::builder()
        .user_agent("prepcode")
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| BackendError::Other(format!("Could not reach prepcode's servers: {e}")))?;
    Ok(CLIENT.get_or_init(|| client))
}

fn provider_id(provider: Provider) -> &'static str {
    match provider {
        Provider::GitHub => "github",
        Provider::Google => "google",
    }
}

fn browser_params(provider: Provider, port: u16, challenge: &str) -> [(&'static str, String); 5] {
    [
        ("provider", provider_id(provider).into()),
        // Supabase passes this on to GitHub and Google, which then ask which
        // account to use instead of quietly picking the one the browser is
        // already signed in to (e.g. the previous student's, after a logout).
        ("prompt", "select_account".into()),
        ("redirect_to", browser::callback_url(port)),
        ("code_challenge", challenge.into()),
        ("code_challenge_method", "s256".into()),
    ]
}

impl Backend for Supabase {
    // --- Signing in ---------------------------------------------------------------------

    fn authorize_url(&self, provider: Provider, port: u16, challenge: &str) -> String {
        Url::parse_with_params(
            &format!("{}/auth/v1/authorize", self.main.url),
            browser_params(provider, port, challenge),
        )
        .map(String::from)
        .unwrap_or_default()
    }

    async fn link_url(
        &self,
        access_token: &str,
        provider: Provider,
        port: u16,
        challenge: &str,
    ) -> Result<String, BackendError> {
        let mut params = browser_params(provider, port, challenge).to_vec();
        params.push(("skip_http_redirect", "true".into()));
        let url =
            Url::parse_with_params(&format!("{}/auth/v1/user/identities/authorize", self.main.url), params)
                .map_err(|e| BackendError::Other(e.to_string()))?;
        let request = client()?.get(url).header("apikey", self.main.key).bearer_auth(access_token);
        let body = send(request).await?;
        body["url"]
            .as_str()
            .map(str::to_owned)
            .ok_or_else(|| BackendError::Other("Unexpected answer from prepcode's servers: no link".into()))
    }

    async fn exchange_code(&self, code: &str, verifier: &str) -> Result<Tokens, BackendError> {
        let body = json!({ "auth_code": code, "code_verifier": verifier });
        tokens(send(self.post("/auth/v1/token?grant_type=pkce")?.json(&body)).await?)
    }

    async fn refresh(&self, refresh_token: &str) -> Result<Tokens, BackendError> {
        let body = json!({ "refresh_token": refresh_token });
        tokens(send(self.post("/auth/v1/token?grant_type=refresh_token")?.json(&body)).await?)
    }

    async fn user(&self, access_token: &str) -> Result<Account, BackendError> {
        let body = send(self.request(Method::GET, "/auth/v1/user")?.bearer_auth(access_token)).await?;
        account_of(&body).ok_or_else(|| {
            BackendError::Other("Unexpected answer from prepcode's servers: no GitHub account".into())
        })
    }

    async fn role_ids(&self, access_token: &str) -> Result<Vec<String>, BackendError> {
        let request = self.post("/rest/v1/rpc/my_role_ids")?.bearer_auth(access_token).json(&json!({}));
        let body = send(request).await?;
        Ok(body
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(|role| role.as_str().map(str::to_owned))
            .collect())
    }

    /// See the `discard-pending-account` function.
    async fn discard_waiting(&self, access_token: &str) -> Result<(), BackendError> {
        let request =
            self.post("/functions/v1/discard-pending-account")?.bearer_auth(access_token).json(&json!({}));
        send(request).await.map(|_| ())
    }

    async fn unlink(&self, access_token: &str, identity_id: &str) -> Result<(), BackendError> {
        let path = format!("/auth/v1/user/identities/{identity_id}");
        send(self.request(Method::DELETE, &path)?.bearer_auth(access_token)).await.map(|_| ())
    }

    async fn sign_out(&self, access_token: &str) -> Result<(), BackendError> {
        send(self.post("/auth/v1/logout?scope=local")?.bearer_auth(access_token)).await.map(|_| ())
    }

    // --- Email and password -------------------------------------------------------------

    async fn sign_up(&self, email: &str, password: &str, name: Option<&str>) -> Result<(), BackendError> {
        let data = name.map(|name| json!({ "full_name": name })).unwrap_or_else(|| json!({}));
        let body = json!({ "email": email, "password": password, "data": data });
        send(self.post("/auth/v1/signup")?.json(&body)).await.map(|_| ())
    }

    async fn resend_sign_up_code(&self, email: &str) -> Result<(), BackendError> {
        let body = json!({ "type": "signup", "email": email });
        send(self.post("/auth/v1/resend")?.json(&body)).await.map(|_| ())
    }

    async fn send_reset_code(&self, email: &str) -> Result<(), BackendError> {
        send(self.post("/auth/v1/recover")?.json(&json!({ "email": email }))).await.map(|_| ())
    }

    async fn verify_email_code(
        &self,
        email: &str,
        code: &str,
        what: EmailCode,
    ) -> Result<Tokens, BackendError> {
        let kind = match what {
            EmailCode::SignUp => "signup",
            EmailCode::Reset => "recovery",
        };
        let body = json!({ "type": kind, "email": email, "token": code });
        tokens(send(self.post("/auth/v1/verify")?.json(&body)).await?)
    }

    async fn sign_in_with_password(&self, email: &str, password: &str) -> Result<Tokens, BackendError> {
        let body = json!({ "email": email, "password": password });
        tokens(send(self.post("/auth/v1/token?grant_type=password")?.json(&body)).await?)
    }

    async fn set_password(&self, access_token: &str, password: &str) -> Result<(), BackendError> {
        let request = self
            .request(Method::PUT, "/auth/v1/user")?
            .bearer_auth(access_token)
            .json(&json!({ "password": password }));
        send(request).await.map(|_| ())
    }

    // --- Syncing ------------------------------------------------------------------------

    /// From the `github-token` function, which also creates the student's
    /// repo once the prepcodes app is installed.
    async fn repo_token(&self, access_token: &str) -> Result<RepoToken, BackendError> {
        let request = self.post("/functions/v1/github-token")?.bearer_auth(access_token).json(&json!({}));
        let response = request.send().await.map_err(|_| BackendError::Offline)?;
        let status = response.status().as_u16();
        let body: Value = response.json().await.unwrap_or(Value::Null);
        let rejected = |message: String| Err(BackendError::Rejected(message));
        let id = |key: &str| body[key].as_u64();
        match (status, body["code"].as_str()) {
            (200, _) => {}
            (_, Some("not_installed")) => return Err(BackendError::NotSetUp(SetupNeeded::Install)),
            (_, Some("repo_not_selected")) => {
                return Err(BackendError::NotSetUp(SetupNeeded::AddRepo { repo_id: id("repo_id") }))
            }
            (_, Some("cannot_create_repo")) => {
                return Err(BackendError::NotSetUp(SetupNeeded::AcceptPermissions {
                    installation_id: id("installation_id"),
                }))
            }
            (_, Some("no_github")) => return rejected("This account has no GitHub sign-in.".into()),
            (401, _) => return rejected("Your sign-in has expired. Log out and sign in again.".into()),
            (500.., _) => return Err(BackendError::Offline),
            _ => {
                let message =
                    body["error"].as_str().unwrap_or("Could not get access to your GitHub repository.");
                return rejected(message.to_owned());
            }
        }
        let field = |key: &str| body[key].as_str().map(str::to_owned);
        let unexpected =
            || BackendError::Other("Unexpected answer from prepcode's servers: no GitHub token".into());
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

    // --- Practice -----------------------------------------------------------------------

    /// Row level security returns only active domains and categories.
    async fn practice_sections(&self) -> Result<Vec<Section>, BackendError> {
        self.main
            .select(
                "pc_domains",
                &[
                    (
                        "select",
                        "slug, title, categories:pc_categories (slug, title, description, icon, \
                         logoUrl:logo_url, details, questionKind:question_kind)",
                    ),
                    ("order", "position.asc"),
                    ("categories.order", "position.asc"),
                ],
            )
            .await
    }

    async fn category_questions(&self, category: &str) -> Result<Vec<QuestionSummary>, BackendError> {
        #[derive(Deserialize)]
        struct Row {
            slug: String,
            title: String,
            difficulty: String,
            topic: String,
            access: String,
        }
        let request =
            self.post("/rest/v1/rpc/pc_category_questions")?.json(&json!({ "p_category_slug": category }));
        let rows: Vec<Row> = parse(send(request).await?)?;
        Ok(rows
            .into_iter()
            .map(|row| QuestionSummary {
                locked: row.access != "public",
                slug: row.slug,
                title: row.title,
                difficulty: row.difficulty,
                topic: row.topic,
            })
            .collect())
    }

    /// Row level security returns only open questions, and of their test
    /// cases only the examples.
    async fn question(&self, slug: &str) -> Result<Option<Question>, BackendError> {
        let slug = format!("eq.{slug}");
        let rows: Vec<Question> = self
            .main
            .select(
                "pc_questions",
                &[
                    (
                        "select",
                        "slug, title, difficulty, topic, description, constraints, explanation, method, \
                         params, returns, examples:pc_test_cases (inputs, expected, note)",
                    ),
                    ("slug", &slug),
                    ("examples.visibility", "eq.example"),
                    ("examples.order", "position.asc"),
                ],
            )
            .await?;
        Ok(rows.into_iter().next())
    }

    /// Row level security returns only open questions (published and
    /// Public), so private questions and their answers never reach the app.
    async fn category_mcqs(&self, category: &str) -> Result<Vec<Mcq>, BackendError> {
        let category = format!("eq.{category}");
        self.main
            .select(
                "pc_questions",
                &[
                    (
                        "select",
                        "id, slug, title, difficulty, topic, description, hints, \
                         options:pc_question_options (id, body, explanation, is_correct), \
                         category:pc_categories!inner (slug)",
                    ),
                    ("category.slug", &category),
                    ("order", "position.asc"),
                    ("options.order", "position.asc"),
                ],
            )
            .await
    }

    async fn add_mcq_events(
        &self,
        access_token: &str,
        events: &[McqEventRecord],
    ) -> Result<(), BackendError> {
        let request = self
            .post("/rest/v1/pc_mcq_events?on_conflict=id")?
            .bearer_auth(access_token)
            .header("Prefer", "resolution=ignore-duplicates,return=minimal")
            .json(events);
        let response = request.send().await.map_err(|_| BackendError::Offline)?;
        let status = response.status().as_u16();
        if (200..300).contains(&status) {
            return Ok(());
        }
        let body: Value = response.json().await.unwrap_or(Value::Null);
        match status {
            400..=499 if ![401, 408, 429].contains(&status) => {
                Err(BackendError::Rejected(body["message"].as_str().unwrap_or("Refused").to_owned()))
            }
            _ => Err(BackendError::Offline),
        }
    }

    async fn mcq_solved(&self, access_token: &str) -> Result<Vec<String>, BackendError> {
        let path = "/rest/v1/pc_mcq_events?select=question:pc_questions(slug)&kind=eq.submit&correct=is.true";
        let body = send(self.request(Method::GET, path)?.bearer_auth(access_token)).await?;
        let mut slugs: Vec<String> = body
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(|row| row["question"]["slug"].as_str().map(str::to_owned))
            .collect();
        slugs.sort();
        slugs.dedup();
        Ok(slugs)
    }

    // --- Jobs ---------------------------------------------------------------------------

    /// Row level security returns only published jobs.
    async fn jobs(&self, today: &str) -> Result<Vec<Job>, BackendError> {
        let open = format!("(deadline.is.null,deadline.gte.{today})");
        self.jobs
            .select(
                "jobs",
                &[
                    (
                        "select",
                        "slug, title, company, logoUrl:logo_url, location, workMode:work_mode, \
                         jobType:job_type, experience, salary, skills, description, applyUrl:apply_url, \
                         postedAt:posted_at, deadline, source, branch",
                    ),
                    ("or", &open),
                    ("order", "posted_at.desc"),
                ],
            )
            .await
    }
}

// --- Answers -----------------------------------------------------------------------------

async fn send(request: RequestBuilder) -> Result<Value, BackendError> {
    let response = request.send().await.map_err(|_| BackendError::Offline)?;
    let status = response.status();
    let body: Value = response.json().await.unwrap_or(Value::Null);
    if status.is_success() {
        return Ok(body);
    }
    Err(error_of(status, &body))
}

/// An answer as `T`, or an error saying it wasn't what prepcode expects.
fn parse<T: DeserializeOwned>(body: Value) -> Result<T, BackendError> {
    serde_json::from_value(body)
        .map_err(|e| BackendError::Other(format!("Unexpected answer from prepcode's servers: {e}")))
}

/// What a failed answer from Supabase means.
fn error_of(status: reqwest::StatusCode, body: &Value) -> BackendError {
    if status.is_server_error() || status == reqwest::StatusCode::REQUEST_TIMEOUT {
        return BackendError::Offline;
    }
    // A college lab shares one internet address, so many PCs signing in at
    // once can hit Supabase's per-address limits.
    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        return BackendError::Rejected(
            "Too many sign-ins from this network right now. Please try again in a few minutes.".into(),
        );
    }
    let message = ["msg", "error_description", "message", "error"]
        .iter()
        .find_map(|key| body[*key].as_str())
        .unwrap_or("The sign-in didn't work. Please try again.")
        .to_owned();
    if body["error_code"].as_str().is_some_and(|code| SIGNED_OUT_CODES.contains(&code)) {
        return BackendError::SignedOut(message);
    }
    BackendError::Rejected(message)
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
}

fn tokens(body: Value) -> Result<Tokens, BackendError> {
    let unexpected =
        |what: &str| BackendError::Other(format!("Unexpected answer from prepcode's servers: {what}"));
    let response: TokenResponse = serde_json::from_value(body).map_err(|_| unexpected("no session"))?;
    let user_id = response.user["id"].as_str().ok_or_else(|| unexpected("no account"))?.to_owned();
    if has_two_githubs(&response.user) {
        // Two students' GitHubs ended up on one account; opening it would
        // show one of them the other's work. Ending the session here keeps it
        // closed (and signs out a saved sign-in) until it's split.
        return Err(BackendError::SignedOut(MERGED_ACCOUNT.into()));
    }
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    Ok(Tokens {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_at: response.expires_at.unwrap_or(now + response.expires_in),
        user_id,
        email: response.user["email"].as_str().map(str::to_owned),
        account: account_of(&response.user),
    })
}

const MERGED_ACCOUNT: &str = "This prepcode account has two GitHub accounts on it, so it can't be opened. \
    Ask your placement officer to contact prepcode support to separate them.";

/// More than one GitHub on the account (see `MERGED_ACCOUNT`).
fn has_two_githubs(user: &Value) -> bool {
    let identities = user["identities"].as_array().map(Vec::as_slice).unwrap_or_default();
    identities.iter().filter(|i| i["provider"] == "github").count() > 1
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

    const BACKEND: Supabase = Supabase::PREPCODE;

    #[test]
    fn only_a_dead_session_signs_out() {
        use reqwest::StatusCode;
        // As Supabase answers an unknown refresh token.
        let gone = json!({
            "code": 400,
            "error_code": "refresh_token_not_found",
            "msg": "Invalid Refresh Token: Refresh Token Not Found"
        });
        assert!(matches!(error_of(StatusCode::BAD_REQUEST, &gone), BackendError::SignedOut(_)));
        let limited = json!({ "code": 429, "error_code": "over_request_rate_limit", "msg": "Rate limit" });
        assert!(matches!(error_of(StatusCode::TOO_MANY_REQUESTS, &limited), BackendError::Rejected(_)));
        assert!(matches!(error_of(StatusCode::BAD_GATEWAY, &Value::Null), BackendError::Offline));
        assert!(matches!(error_of(StatusCode::FORBIDDEN, &Value::Null), BackendError::Rejected(_)));
    }

    #[test]
    fn authorize_url_returns_to_this_computer() {
        let url = Url::parse(&BACKEND.authorize_url(Provider::GitHub, 51234, "challenge")).unwrap();
        let param = |name: &str| url.query_pairs().find(|(k, _)| k == name).map(|(_, v)| v.into_owned());
        assert_eq!(url.path(), "/auth/v1/authorize");
        assert_eq!(param("provider").as_deref(), Some("github"));
        assert_eq!(param("redirect_to").as_deref(), Some("http://127.0.0.1:51234/auth/callback"));
        assert_eq!(param("code_challenge_method").as_deref(), Some("s256"));
        assert_eq!(param("prompt").as_deref(), Some("select_account"));
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
    fn refuses_an_account_with_two_githubs() {
        let github = |id: &str| json!({ "provider": "github", "identity_data": { "provider_id": id } });
        let session = |identities: Value| {
            json!({
                "access_token": "a", "refresh_token": "r", "expires_in": 3600,
                "user": { "id": "u", "identities": identities },
            })
        };
        assert!(tokens(session(json!([github("1")]))).is_ok());
        assert!(matches!(
            tokens(session(json!([github("1"), github("2")]))),
            Err(BackendError::SignedOut(_))
        ));
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

    /// The content reads against the real project, as a guest would.
    /// Run with: cargo test reads_practice_and_jobs -- --ignored
    #[test]
    #[ignore = "reads from Supabase"]
    fn reads_practice_and_jobs() {
        tauri::async_runtime::block_on(async {
            let sections = BACKEND.practice_sections().await.unwrap();
            assert!(!sections.is_empty());
            let categories: Vec<_> = sections.iter().flat_map(|s| &s.categories).collect();

            let coding = categories.iter().find(|c| c.question_kind == "coding").expect("a coding category");
            let questions = BACKEND.category_questions(&coding.slug).await.unwrap();
            if let Some(open) = questions.iter().find(|q| !q.locked) {
                let question = BACKEND.question(&open.slug).await.unwrap().expect("an open question");
                assert_eq!(question.slug, open.slug);
            }
            assert!(BACKEND.question("no-such-question").await.unwrap().is_none());

            let mcq = categories.iter().find(|c| c.question_kind == "mcq").expect("an MCQ category");
            let mcqs = BACKEND.category_mcqs(&mcq.slug).await.unwrap();
            assert!(mcqs.iter().all(|q| !q.options.is_empty()));

            BACKEND.jobs("2026-10-28").await.unwrap();
        });
    }
}
