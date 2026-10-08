import { invoke } from "@tauri-apps/api/core";

export type Session = {
  /** The workspace id: `gh-<GitHub user id>`, or a generated id for a guest. */
  id: string;
  /** GitHub username, or "Guest". */
  login: string;
  avatarUrl: string | null;
  /** A guest's files are deleted when they log out or close prepcode. */
  guest: boolean;
};

/** The sign-in page in the browser, to open again if the browser didn't. */
export type SignInLink = {
  url: string;
};

/** How to show who's signed in. */
export function displayName(session: Session) {
  return session.login;
}

/** The student who's still signed in on this computer, if any (on launch). */
export function restoreSession() {
  return invoke<Session | null>("restore_session");
}

/** Opens GitHub in the browser to sign in. Rejects with a user-facing message. */
export function startGitHubSignIn() {
  return invoke<SignInLink>("start_github_sign_in");
}

/**
 * Opens Google in the browser to sign in. A new Google account gets an account
 * that needs GitHub connected next (startGitHubConnect).
 */
export function startGoogleSignIn() {
  return invoke<SignInLink>("start_google_sign_in");
}

/** Opens Google in the browser to connect it to the signed-in account. */
export function startGoogleLink() {
  return invoke<SignInLink>("start_google_link");
}

/** Opens GitHub in the browser to connect it to the account waiting for it. */
export function startGitHubConnect() {
  return invoke<SignInLink>("start_github_connect");
}

/**
 * Deletes the account that's waiting for GitHub (signed in with Google, no
 * GitHub yet): when the student cancels, or before signing in to the account
 * their GitHub already has.
 */
export function discardWaitingAccount() {
  return invoke<void>("discard_waiting_account");
}

/** How a trip to the browser ended. Mirrors SignInResult in auth.rs. */
export type SignInResult =
  /** Signed in (or, from Profile → Gmail, Google connected). */
  | { kind: "signedIn"; session: Session }
  /** Signed in (Google or email) to an account with no GitHub: connect it next. */
  | { kind: "needsGitHub"; email: string | null }
  /** Signed up with email but never entered the code: a new one was sent. */
  | { kind: "needsEmailCode"; email: string }
  /** The GitHub they picked already has a prepcode account. */
  | { kind: "gitHubTaken"; email: string | null };

/**
 * Resolves once the student approves in the browser and it comes back, or to
 * null if it was cancelled. Rejects with a user-facing message.
 */
export function finishSignIn() {
  return invoke<SignInResult | null>("finish_sign_in");
}

export function cancelSignIn() {
  return invoke<void>("cancel_sign_in");
}

/** What Profile shows about the signed-in account. */
export type AccountDetails = {
  googleConnected: boolean;
  /** The connected Google account's email. */
  googleEmail: string | null;
};

export function accountDetails() {
  return invoke<AccountDetails>("account_details");
}

/** Disconnects Google: the student signs in with GitHub only. */
export function unlinkGoogle() {
  return invoke<AccountDetails>("unlink_google");
}

/** Starts a session with no account, in an empty workspace that isn't kept. */
export function guestLogin() {
  return invoke<Session>("guest_login");
}

export function logout() {
  return invoke<void>("logout");
}

/** Passwords need at least this many characters (checked in Rust too). */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Email + password is for college and work email: Gmail signs in with Continue
 * with Google. Mirrors GOOGLE_EMAIL_DOMAINS in auth.rs (the server refuses
 * these sign-ups too).
 */
export function isGoogleEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1];
  return domain === "gmail.com" || domain === "googlemail.com";
}

/** Digits in the codes sent by email (Supabase's Email OTP Length). */
export const EMAIL_CODE_LENGTH = 6;

/**
 * Creates an account with email and password; a code to confirm it is
 * emailed. Resolves the same if the email already has an account (then no
 * code comes), so nobody can find out which emails have accounts.
 */
export function emailSignUp(email: string, password: string, name: string) {
  return invoke<void>("email_sign_up", { email, password, name: name || null });
}

export function emailResendCode(email: string) {
  return invoke<void>("email_resend_code", { email });
}

/** Checks the code from the sign-up email, which signs the student in. */
export function emailVerifyCode(email: string, code: string) {
  return invoke<SignInResult>("email_verify_code", { email, code });
}

export function emailSignIn(email: string, password: string) {
  return invoke<SignInResult>("email_sign_in", { email, password });
}

/** Emails a code for choosing a new password (whether or not the email has an account). */
export function emailSendResetCode(email: string) {
  return invoke<void>("email_send_reset_code", { email });
}

/** Checks the reset code, sets the new password and signs the student in. */
export function emailResetPassword(email: string, code: string, password: string) {
  return invoke<SignInResult>("email_reset_password", { email, code, password });
}
