//! The one way prepcode talks to its backend.
//!
//! The frontend never calls a server itself: it calls a Rust command, and
//! Rust calls the backend through `Backend`. Today that's Supabase (see
//! supabase.rs); later it may be prepcode's own API. Switching means writing
//! another implementation and returning it from `get`, with nothing changed
//! in the commands or the frontend. So the trait speaks prepcode's terms (MCQ
//! events, a repo token, a category's questions), never a backend's (tables,
//! RPCs, edge functions), and only typed values cross it.
//!
//! GitHub sync's own requests to GitHub (github.rs) aren't the backend: the
//! backend only hands out the token for them.

pub mod browser;
mod supabase;

use std::future::Future;

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// The backend in use.
static BACKEND: supabase::Supabase = supabase::Supabase::PREPCODE;

/// The backend, as `Backend` only, so nothing can depend on how it's built.
pub fn get() -> &'static impl Backend {
    &BACKEND
}

/// Everything prepcode asks of its backend. `access_token` is the signed-in
/// student's; the content methods need no sign-in, so guests can practise.
pub trait Backend: Sync {
    // --- Signing in ---------------------------------------------------------------------

    /// Where the browser goes to sign in with `provider`, coming back to this
    /// computer's `port` (see `browser`) with a one-time code.
    fn authorize_url(&self, provider: Provider, port: u16, challenge: &str) -> String;

    /// Where the browser goes to connect `provider` to the signed-in account,
    /// as another way to sign in. It comes back to `port` like a sign-in does.
    fn link_url(
        &self,
        access_token: &str,
        provider: Provider,
        port: u16,
        challenge: &str,
    ) -> impl Future<Output = Result<String, BackendError>> + Send;

    /// Swaps the one-time code from the browser for a session.
    fn exchange_code(
        &self,
        code: &str,
        verifier: &str,
    ) -> impl Future<Output = Result<Tokens, BackendError>> + Send;

    /// A new session from a saved refresh token. Only SignedOut means the
    /// student must sign in again (signed out elsewhere, or the token was
    /// already used); any other error leaves the saved sign-in as it is.
    fn refresh(&self, refresh_token: &str) -> impl Future<Output = Result<Tokens, BackendError>> + Send;

    /// The signed-in account as the backend has it now.
    fn user(&self, access_token: &str) -> impl Future<Output = Result<Account, BackendError>> + Send;

    /// The signed-in account's roles (staff roles, "faculty", "tpo",
    /// "student"), as the staff tools see them. Empty for a student not yet
    /// enrolled. An answer that isn't a list of roles must be an error, not
    /// an empty list: an empty list lets the account in as a student.
    fn role_ids(&self, access_token: &str) -> impl Future<Output = Result<Vec<String>, BackendError>> + Send;

    /// Deletes the signed-in account while it's still waiting for GitHub,
    /// freeing its Google login.
    fn discard_waiting(&self, access_token: &str) -> impl Future<Output = Result<(), BackendError>> + Send;

    /// Removes a linked way to sign in (GitHub, which made the account, stays).
    fn unlink(
        &self,
        access_token: &str,
        identity_id: &str,
    ) -> impl Future<Output = Result<(), BackendError>> + Send;

    /// Ends this session on the backend (other computers stay signed in).
    fn sign_out(&self, access_token: &str) -> impl Future<Output = Result<(), BackendError>> + Send;

    // --- Email and password -------------------------------------------------------------

    /// Creates an account with email and password, then emails a code to
    /// confirm it (`verify_email_code`). For an email that already has an
    /// account it answers the same but sends nothing, so nobody can find out
    /// which emails have accounts.
    fn sign_up(
        &self,
        email: &str,
        password: &str,
        name: Option<&str>,
    ) -> impl Future<Output = Result<(), BackendError>> + Send;

    /// Sends the sign-up code again.
    fn resend_sign_up_code(&self, email: &str) -> impl Future<Output = Result<(), BackendError>> + Send;

    /// Emails a code for resetting the password. Answers the same whether or
    /// not the email has an account.
    fn send_reset_code(&self, email: &str) -> impl Future<Output = Result<(), BackendError>> + Send;

    /// Checks a code from an email, which signs the student in.
    fn verify_email_code(
        &self,
        email: &str,
        code: &str,
        what: EmailCode,
    ) -> impl Future<Output = Result<Tokens, BackendError>> + Send;

    fn sign_in_with_password(
        &self,
        email: &str,
        password: &str,
    ) -> impl Future<Output = Result<Tokens, BackendError>> + Send;

    /// Changes the signed-in account's password.
    fn set_password(
        &self,
        access_token: &str,
        password: &str,
    ) -> impl Future<Output = Result<(), BackendError>> + Send;

    // --- Syncing ------------------------------------------------------------------------

    /// A GitHub token for the student's `prepcode-programs` repo and nothing
    /// else, or what they still have to set up on GitHub (`NotSetUp`).
    fn repo_token(&self, access_token: &str) -> impl Future<Output = Result<RepoToken, BackendError>> + Send;

    // --- Practice -----------------------------------------------------------------------

    /// Every active section with its active categories, in display order.
    fn practice_sections(&self) -> impl Future<Output = Result<Vec<Section>, BackendError>> + Send;

    /// A coding category's published questions, in order; private ones come
    /// locked.
    fn category_questions(
        &self,
        category: &str,
    ) -> impl Future<Output = Result<Vec<QuestionSummary>, BackendError>> + Send;

    /// An open question with its examples (never its hidden test cases), or
    /// None if it isn't open (unpublished, or private).
    fn question(&self, slug: &str) -> impl Future<Output = Result<Option<Question>, BackendError>> + Send;

    /// An MCQ category's open questions, in order, with their options and hints.
    fn category_mcqs(&self, category: &str) -> impl Future<Output = Result<Vec<Mcq>, BackendError>> + Send;

    /// Adds MCQ events as the signed-in student. One already there (same id),
    /// e.g. sent again after a lost reply, is kept once. Rejected means the
    /// events themselves were refused, so they never will be accepted; Offline
    /// covers everything worth trying again later, an expired sign-in or too
    /// many requests included.
    fn add_mcq_events(
        &self,
        access_token: &str,
        events: &[McqEventRecord],
    ) -> impl Future<Output = Result<(), BackendError>> + Send;

    /// The MCQs the signed-in student has answered right, by slug, sorted.
    /// Questions no longer open aren't counted.
    fn mcq_solved(
        &self,
        access_token: &str,
    ) -> impl Future<Output = Result<Vec<String>, BackendError>> + Send;

    // --- Jobs ---------------------------------------------------------------------------

    /// Published jobs still open on `today` (the student's YYYY-MM-DD), newest first.
    fn jobs(&self, today: &str) -> impl Future<Output = Result<Vec<Job>, BackendError>> + Send;
}

// --- Errors ------------------------------------------------------------------------------

/// Why a request to the backend didn't work.
pub enum BackendError {
    /// No connection, a timeout, or the server is down: try again later.
    Offline,
    /// The backend refused, e.g. a used code or too many requests.
    Rejected(String),
    /// The session is over for good (signed out, deleted, or its refresh
    /// token already used): only this means "sign in again".
    SignedOut(String),
    /// The student's GitHub isn't set up for syncing yet: what's left to do.
    NotSetUp(SetupNeeded),
    Other(String),
}

impl BackendError {
    pub fn message(&self) -> String {
        match self {
            BackendError::Offline => {
                "Could not reach prepcode's servers. Check your internet connection.".into()
            }
            BackendError::NotSetUp(needed) => needed.message(),
            BackendError::Rejected(message)
            | BackendError::SignedOut(message)
            | BackendError::Other(message) => message.clone(),
        }
    }
}

// By hand, so a token never ends up in a log.
impl std::fmt::Debug for BackendError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BackendError::Offline => write!(f, "Offline"),
            BackendError::Rejected(message) => write!(f, "Rejected({message:?})"),
            BackendError::SignedOut(message) => write!(f, "SignedOut({message:?})"),
            BackendError::NotSetUp(needed) => write!(f, "NotSetUp({needed:?})"),
            BackendError::Other(message) => write!(f, "Other({message:?})"),
        }
    }
}

// --- Accounts ----------------------------------------------------------------------------

/// The signed-in student, as saved on this computer.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Account {
    /// The backend's account id.
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
    /// The backend's id for the link, needed to remove it.
    pub identity_id: String,
    pub email: Option<String>,
}

/// The providers a student can sign in with. Only GitHub creates an account
/// (the backend refuses new accounts from the others).
#[derive(Clone, Copy)]
pub enum Provider {
    GitHub,
    Google,
}

/// A signed-in session. Syncing gets short-lived repo tokens another way, so
/// GitHub's and Google's own tokens are never kept.
pub struct Tokens {
    /// Valid for an hour; only ever kept in memory.
    pub access_token: String,
    /// Keeps the student signed in. Each one works once: save the new one.
    pub refresh_token: String,
    /// Unix seconds.
    pub expires_at: u64,
    /// The backend's account id.
    pub user_id: String,
    pub email: Option<String>,
    /// None while the account has no GitHub yet (it started with Google).
    pub account: Option<Account>,
}

/// What a code sent by email is for.
#[derive(Clone, Copy)]
pub enum EmailCode {
    /// Confirming the email of a new account.
    SignUp,
    /// Resetting a forgotten password.
    Reset,
}

// --- Syncing -----------------------------------------------------------------------------

/// Sync errors that the student fixes on GitHub start with this, so the app
/// can offer a button to the prepcodes install page.
pub const CONNECT_GITHUB: &str = "Connect GitHub:";

/// What the student still has to do on GitHub before prepcode can sync. The
/// backend creates their `prepcode-programs` repo itself once the prepcodes
/// app is installed, so it's only ever about the app's access.
#[derive(Clone, Debug, PartialEq)]
pub enum SetupNeeded {
    /// Install the prepcodes app on their GitHub account.
    Install,
    /// Give the installed app their existing repo (GitHub's id for it, if the
    /// backend knows it).
    AddRepo { repo_id: Option<u64> },
    /// The installed app couldn't create their repo: accept its newer
    /// permissions on the installation's settings page.
    AcceptPermissions { installation_id: Option<u64> },
}

impl SetupNeeded {
    fn message(&self) -> String {
        let what = match self {
            SetupNeeded::Install => "install the prepcodes app on GitHub.",
            SetupNeeded::AddRepo { .. } => {
                "give prepcode access to your prepcode-programs repository on GitHub."
            }
            SetupNeeded::AcceptPermissions { .. } => "accept prepcode's new permissions on GitHub.",
        };
        format!("{CONNECT_GITHUB} {what}")
    }
}

/// A GitHub token for the student's `prepcode-programs` repo, and nothing
/// else. It works for an hour.
#[derive(Clone)]
pub struct RepoToken {
    pub token: String,
    /// Unix seconds.
    pub expires_at: u64,
    pub github_login: String,
}

// --- Practice ----------------------------------------------------------------------------
//
// As the frontend's types in lib/practice.ts, lib/questions.ts and lib/mcq.ts
// take them. Checking a question's values against its signature stays in the
// frontend, next to the drivers that need it.

/// A heading on the Practice screen, e.g. "Indian Company Exams".
#[derive(Serialize, Deserialize)]
pub struct Section {
    pub slug: String,
    pub title: String,
    pub categories: Vec<Category>,
}

/// A group of questions, shown as a card on the Practice screen.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub slug: String,
    pub title: String,
    pub description: String,
    /// A lucide icon name, e.g. "brain".
    pub icon: Option<String>,
    /// A company's logo (an image URL), shown instead of the icon.
    pub logo_url: Option<String>,
    /// Markdown: e.g. a company's exam pattern and eligibility requirements.
    pub details: Option<String>,
    /// Which screen its questions open in: "coding" or "mcq".
    pub question_kind: String,
}

/// A coding question as its category lists it, before it's opened.
#[derive(Serialize, Deserialize)]
pub struct QuestionSummary {
    pub slug: String,
    pub title: String,
    /// "easy", "medium" or "hard".
    pub difficulty: String,
    pub topic: String,
    /// Private: listed, but students can't open it yet.
    pub locked: bool,
}

/// A coding question with its examples.
#[derive(Serialize, Deserialize)]
pub struct Question {
    pub slug: String,
    pub title: String,
    pub difficulty: String,
    pub topic: String,
    pub description: String,
    pub constraints: String,
    pub explanation: String,
    /// The method to write; empty for a question not ready to solve yet.
    pub method: String,
    pub params: Vec<Param>,
    pub returns: String,
    /// In order.
    pub examples: Vec<Example>,
}

#[derive(Serialize, Deserialize)]
pub struct Param {
    pub name: String,
    /// One of the drivers' types, e.g. "int[]".
    #[serde(rename = "type")]
    pub kind: String,
}

/// An example: the method's arguments and what it should return, as JSON.
#[derive(Serialize, Deserialize)]
pub struct Example {
    pub inputs: Vec<Value>,
    pub expected: Value,
    pub note: String,
}

/// An MCQ. The question, each hint and each option are markdown.
#[derive(Serialize, Deserialize)]
pub struct Mcq {
    /// What its events are recorded against.
    pub id: String,
    pub slug: String,
    pub title: String,
    pub difficulty: String,
    pub topic: String,
    pub description: String,
    pub hints: Vec<String>,
    /// In the author's order.
    pub options: Vec<McqOption>,
}

#[derive(Serialize, Deserialize)]
pub struct McqOption {
    pub id: String,
    pub body: String,
    pub explanation: String,
    pub is_correct: bool,
}

/// Something a student did on an MCQ, as the backend keeps it.
#[derive(Serialize)]
pub struct McqEventRecord {
    /// A uuid made on this computer, so sending it twice keeps it once.
    pub id: String,
    pub question_id: String,
    /// "submit" or "hint".
    pub kind: String,
    /// A submit's option.
    pub option_id: Option<String>,
    /// A hint's place in the question's hints, from 0.
    pub hint_index: Option<i64>,
    /// When, as ISO 8601 in UTC.
    pub at: String,
}

// --- Jobs --------------------------------------------------------------------------------

/// A job opening on the Jobs screen, as lib/jobs.ts takes it.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    pub slug: String,
    pub title: String,
    pub company: String,
    pub logo_url: Option<String>,
    /// One or more, separated by semicolons.
    pub location: String,
    pub work_mode: String,
    pub job_type: String,
    pub experience: String,
    pub salary: Option<String>,
    pub skills: Vec<String>,
    /// Markdown.
    pub description: String,
    pub apply_url: String,
    /// ISO timestamp.
    pub posted_at: String,
    /// YYYY-MM-DD; None when open until filled.
    pub deadline: Option<String>,
    pub source: String,
    pub branch: Option<String>,
}
