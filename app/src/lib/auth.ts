import { invoke } from "@tauri-apps/api/core";

export type Session = {
  /** The register number, or a generated id for a guest. */
  reg_no: string;
  /** A guest's files are deleted when they log out or close prepcode. */
  guest: boolean;
};

/** How to show who's signed in. */
export function displayName(session: Session) {
  return session.guest ? "Guest" : session.reg_no;
}

/** `dob` is YYYY-MM-DD. Rejects with a user-facing message string. */
export function register(regNo: string, dob: string) {
  return invoke<Session>("register", { regNo, dob });
}

export function login(regNo: string, dob: string) {
  return invoke<Session>("login", { regNo, dob });
}

/** Starts a session with no account, in an empty workspace that isn't kept. */
export function guestLogin() {
  return invoke<Session>("guest_login");
}

export function logout() {
  return invoke<void>("logout");
}
