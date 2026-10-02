// Whether closing the window should stop and ask first: a student has
// unsynced changes, or a guest has files that closing deletes. Shared by the
// question itself and the updater, which installs on close (or restarts) and
// must not while the close is being held back.

let guarded = false;
let allowed = false;

export function setCloseGuarded(needed: boolean) {
  guarded = needed;
}

export function isCloseBlocked() {
  return guarded && !allowed;
}

/** The student chose to close anyway: let the next close through. */
export function allowClose() {
  allowed = true;
}
