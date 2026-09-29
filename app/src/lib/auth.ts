import { invoke } from "@tauri-apps/api/core";

export type Session = { reg_no: string };

/** `dob` is YYYY-MM-DD. Rejects with a user-facing message string. */
export function register(regNo: string, dob: string) {
  return invoke<Session>("register", { regNo, dob });
}

export function login(regNo: string, dob: string) {
  return invoke<Session>("login", { regNo, dob });
}

export function logout() {
  return invoke<void>("logout");
}
