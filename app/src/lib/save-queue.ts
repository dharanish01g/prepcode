/**
 * FIFO queue for ordering saves, renames, and deletions.
 *
 * Tasks run one at a time, in order, so an older save can never land after a
 * newer one, and a save queued before a delete cannot resurrect the file
 * afterwards. If any task rejects, subsequent queued tasks still execute.
 */
export function createSaveQueue() {
  let queue: Promise<unknown> = Promise.resolve();

  return {
    enqueue<T>(task: () => Promise<T>): Promise<T> {
      const run = queue.catch(() => {}).then(task);
      queue = run;
      return run;
    },
    settled(): Promise<void> {
      return queue.then(
        () => {},
        () => {},
      );
    },
  };
}

export type PendingEdit = {
  filename: string;
  content: string;
  revision: number;
};

export type SaveFn = (edit: { filename: string; content: string }) => Promise<void>;

/**
 * Revision-aware editor save coordinator.
 *
 * Guarantees:
 * 1. Monotonically increasing revisions per file.
 * 2. Overlapping flush calls await in-flight writes without issuing duplicate saves.
 * 3. A failed save only restores its edit into pending if that exact revision is still
 *    the latest revision for that file and has not been superseded by a newer edit.
 * 4. A newer revision can never be overwritten by an older asynchronous save failure or retry.
 * 5. Supports multi-file pending tracking across file switches.
 */
export function createEditorSaveCoordinator(saveFn: SaveFn) {
  const revisions = new Map<string, number>();
  const savedRevisions = new Map<string, number>();
  const discardedRevisions = new Map<string, number>();
  const pendingByFile = new Map<string, PendingEdit>();
  const inflightByFile = new Map<string, Promise<void>>();

  function recordEdit(filename: string, content: string): number {
    const rev = (revisions.get(filename) ?? 0) + 1;
    revisions.set(filename, rev);
    pendingByFile.set(filename, { filename, content, revision: rev });
    return rev;
  }

  async function flushFile(filename: string): Promise<void> {
    const existingInflight = inflightByFile.get(filename);
    const hadPendingEdit = pendingByFile.has(filename);
    if (existingInflight) {
      try {
        await existingInflight;
      } catch (err) {
        if (!hadPendingEdit) {
          throw err;
        }
      }
    }

    const pending = pendingByFile.get(filename);
    if (!pending) {
      return;
    }

    pendingByFile.delete(filename);
    const task = (async () => {
      try {
        await saveFn({ filename: pending.filename, content: pending.content });
        savedRevisions.set(
          pending.filename,
          Math.max(savedRevisions.get(pending.filename) ?? 0, pending.revision),
        );
      } catch (err) {
        // Only restore if this exact revision is still the latest revision
        // for this file, has not been superseded by a newer edit, a newer
        // revision has not already been successfully saved, and this revision
        // was not explicitly discarded.
        const latestRev = revisions.get(pending.filename) ?? 0;
        const lastSaved = savedRevisions.get(pending.filename) ?? 0;
        const discardedRev = discardedRevisions.get(pending.filename) ?? 0;
        if (
          latestRev === pending.revision &&
          lastSaved < pending.revision &&
          pending.revision > discardedRev
        ) {
          if (!pendingByFile.has(pending.filename)) {
            pendingByFile.set(pending.filename, pending);
          }
        }
        throw err;
      }
    })();

    inflightByFile.set(filename, task);
    try {
      await task;
    } finally {
      if (inflightByFile.get(filename) === task) {
        inflightByFile.delete(filename);
      }
    }
  }

  async function flush(targetFilename?: string): Promise<void> {
    if (targetFilename) {
      while (pendingByFile.has(targetFilename) || inflightByFile.has(targetFilename)) {
        await flushFile(targetFilename);
      }
      return;
    }
    while (pendingByFile.size > 0 || inflightByFile.size > 0) {
      const targets = new Set<string>([...pendingByFile.keys(), ...inflightByFile.keys()]);
      if (targets.size === 0) break;
      await Promise.all(Array.from(targets).map((f) => flushFile(f)));
    }
  }

  function discard(targetFilename?: string): void {
    if (targetFilename) {
      discardedRevisions.set(targetFilename, revisions.get(targetFilename) ?? 0);
      pendingByFile.delete(targetFilename);
    } else {
      for (const [f, rev] of revisions.entries()) {
        discardedRevisions.set(f, rev);
      }
      pendingByFile.clear();
    }
  }

  return {
    recordEdit,
    flush,
    flushFile,
    discard,
  };
}
