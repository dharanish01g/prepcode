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
  /** Signed in with Google to an account with no GitHub: connect it next. */
  | { kind: "needsGitHub"; email: string | null }
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
