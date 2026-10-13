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
  const pendingByFile = new Map<string, PendingEdit>();
  const inflightByFile = new Map<string, Promise<void>>();

  function recordEdit(filename: string, content: string): number {
    const rev = (revisions.get(filename) ?? 0) + 1;
    revisions.set(filename, rev);
    pendingByFile.set(filename, { filename, content, revision: rev });
    return rev;
  }

  function getPending(filename?: string): PendingEdit | undefined {
    if (filename) return pendingByFile.get(filename);
    return pendingByFile.values().next().value;
  }

  function hasPending(filename?: string): boolean {
    if (filename) return pendingByFile.has(filename);
    return pendingByFile.size > 0;
  }

  function getLatestRevision(filename: string): number {
    return revisions.get(filename) ?? 0;
  }

  function getSavedRevision(filename: string): number {
    return savedRevisions.get(filename) ?? 0;
  }

  async function flushFile(filename: string): Promise<void> {
    const pending = pendingByFile.get(filename);
    if (pending) {
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
          // for this file, has not been superseded by a newer edit, and a newer
          // revision has not already been successfully saved.
          const latestRev = revisions.get(pending.filename) ?? 0;
          const lastSaved = savedRevisions.get(pending.filename) ?? 0;
          if (latestRev === pending.revision && lastSaved < pending.revision) {
            if (!pendingByFile.has(pending.filename)) {
              pendingByFile.set(pending.filename, pending);
            }
          }
          throw err;
        }
      })();

      const previousInflight = inflightByFile.get(filename);
      const combined = (async () => {
        try {
          await task;
        } catch {
          // Task error is propagated to the caller awaiting task;
          // combined is purely an inflight synchronization tracker.
        } finally {
          if (previousInflight) {
            try {
              await previousInflight;
            } catch {
              // Ignore previous inflight errors in the combined tracker
            }
          }
        }
      })();

      inflightByFile.set(filename, combined);
      try {
        await task;
      } finally {
        if (inflightByFile.get(filename) === combined) {
          inflightByFile.delete(filename);
        }
      }
    } else {
      const inflight = inflightByFile.get(filename);
      if (inflight) {
        await inflight;
      }
    }
  }

  async function flush(targetFilename?: string): Promise<void> {
    if (targetFilename) {
      await flushFile(targetFilename);
      return;
    }
    const targets = new Set<string>([...pendingByFile.keys(), ...inflightByFile.keys()]);
    if (targets.size === 0) return;
    await Promise.all(Array.from(targets).map((f) => flushFile(f)));
  }

  return {
    recordEdit,
    getPending,
    hasPending,
    getLatestRevision,
    getSavedRevision,
    flush,
    flushFile,
    revisions,
    savedRevisions,
    pendingByFile,
    inflightByFile,
  };
}
