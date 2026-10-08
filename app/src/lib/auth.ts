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
 * Resolves once the student approves on GitHub and the browser comes back, or
 * to null if the sign-in was cancelled. Rejects with a user-facing message.
 */
export function finishGitHubSignIn() {
  return invoke<Session | null>("finish_github_sign_in");
}

export function cancelGitHubSignIn() {
  return invoke<void>("cancel_github_sign_in");
}

/** Starts a session with no account, in an empty workspace that isn't kept. */
export function guestLogin() {
  return invoke<Session>("guest_login");
}

export function logout() {
  return invoke<void>("logout");
}
