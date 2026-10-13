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
