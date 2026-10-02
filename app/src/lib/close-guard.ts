// Whether closing the window should stop and warn about unsynced changes.
// Shared by the warning itself and the updater, which installs on close and
// must not when the close is being held back.

let unsynced = 0;
let allowed = false;

export function setUnsyncedForClose(count: number) {
  unsynced = count;
}

export function isCloseBlocked() {
  return unsynced > 0 && !allowed;
}

/** The student chose to close anyway: let the next close through. */
export function allowClose() {
  allowed = true;
}
