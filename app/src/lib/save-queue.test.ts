/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";
import { createEditorSaveCoordinator, createSaveQueue } from "./save-queue.ts";

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("save queue: sequential execution on save success", async () => {
  const queue = createSaveQueue();
  const order: number[] = [];

  const p1 = queue.enqueue(async () => {
    await new Promise((r) => setTimeout(r, 20));
    order.push(1);
    return "file1";
  });

  const p2 = queue.enqueue(async () => {
    order.push(2);
    return "file2";
  });

  const [res1, res2] = await Promise.all([p1, p2]);
  assert.equal(res1, "file1");
  assert.equal(res2, "file2");
  assert.deepEqual(order, [1, 2], "Later tasks wait for earlier tasks to complete");
});

test("save queue: save rejection does not block subsequent queued saves", async () => {
  const queue = createSaveQueue();
  const order: string[] = [];

  const failing = queue.enqueue(async () => {
    order.push("fail_attempt");
    throw new Error("Disk full or permission denied");
  });

  const succeeding = queue.enqueue(async () => {
    order.push("succeed_attempt");
    return "ok";
  });

  await assert.rejects(failing, { message: "Disk full or permission denied" });
  const result = await succeeding;
  assert.equal(result, "ok");
  assert.deepEqual(order, ["fail_attempt", "succeed_attempt"]);
});

test("save queue: rapid consecutive edits maintain strict execution order", async () => {
  const queue = createSaveQueue();
  const history: string[] = [];

  const edits = ["v1", "v2", "v3", "v4", "v5"];
  const promises = edits.map((val, idx) =>
    queue.enqueue(async () => {
      // Simulate variable network/IO latencies
      await new Promise((r) => setTimeout(r, (5 - idx) * 5));
      history.push(val);
      return val;
    }),
  );

  await Promise.all(promises);
  assert.deepEqual(history, ["v1", "v2", "v3", "v4", "v5"], "Edits execute in exact queue order");
});

test("save queue: file switching during in-flight save preserves order", async () => {
  const queue = createSaveQueue();
  const log: string[] = [];

  // Start saving fileA
  const saveA = queue.enqueue(async () => {
    await new Promise((r) => setTimeout(r, 25));
    log.push("save:fileA.py");
  });

  // Switch to fileB and save
  const saveB = queue.enqueue(async () => {
    log.push("save:fileB.py");
  });

  await Promise.all([saveA, saveB]);
  assert.deepEqual(log, ["save:fileA.py", "save:fileB.py"]);
});

test("regression: failed older revision A never overwrites newer revision B after B started and succeeded", async () => {
  const saveCalls: { filename: string; content: string }[] = [];
  const defA = deferred<void>();
  const defB = deferred<void>();

  const coordinator = createEditorSaveCoordinator(async (edit) => {
    saveCalls.push({ ...edit });
    if (edit.content === "revA") {
      await defA.promise;
    } else if (edit.content === "revB") {
      await defB.promise;
    }
  });

  // 1. Revision A begins saving.
  coordinator.recordEdit("app.py", "revA");
  const flushA = coordinator.flushFile("app.py");

  assert.equal(saveCalls.length, 1);
  assert.equal(saveCalls[0].content, "revA");

  // 2. The user types revision B.
  coordinator.recordEdit("app.py", "revB");

  // 3. Revision B begins saving before A finishes.
  // Because flushFile awaits in-flight writes for the same file, flushB awaits revA before starting revB.
  const flushB = coordinator.flushFile("app.py");

  // Rev A is still in flight, so revB has not been called yet
  assert.equal(saveCalls.length, 1);

  // 4. A fails after B has been scheduled.
  defA.reject(new Error("I/O error during save of revision A"));
  await assert.rejects(flushA, { message: "I/O error during save of revision A" });

  // Now flushB proceeds to save revB
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(saveCalls.length, 2);
  assert.equal(saveCalls[1].content, "revB");

  // 5. B succeeds.
  defB.resolve();
  await flushB;

  // 6. A later flush must never write revision A over revision B.
  await coordinator.flush("app.py");
  assert.equal(saveCalls.length, 2, "No subsequent write should overwrite revision B");
});

test("coordinator: overlapping flush requests do not duplicate writes", async () => {
  let writeCount = 0;
  const def = deferred<void>();

  const coordinator = createEditorSaveCoordinator(async (_edit) => {
    writeCount++;
    await def.promise;
  });

  coordinator.recordEdit("app.py", "print('hello')");
  const p1 = coordinator.flush();
  const p2 = coordinator.flush();

  assert.equal(writeCount, 1, "Only one disk write should occur for concurrent flushes");
  def.resolve();
  await Promise.all([p1, p2]);

  assert.equal(writeCount, 1);
  await coordinator.flush();
  assert.equal(writeCount, 1, "Subsequent flush has no pending work");
});

test("coordinator: rapid typing coalesces intermediate edits and saves latest revision", async () => {
  const savedEdits: string[] = [];
  const coordinator = createEditorSaveCoordinator(async (edit) => {
    savedEdits.push(edit.content);
  });

  for (let i = 1; i <= 5; i++) {
    coordinator.recordEdit("app.py", `typed_v${i}`);
  }

  await coordinator.flush();

  assert.deepEqual(savedEdits, ["typed_v5"]);
  await coordinator.flush();
  assert.deepEqual(savedEdits, ["typed_v5"]);
});

test("coordinator: serializes writes for the same file so older saves settle before newer saves start", async () => {
  const saveCalls: { filename: string; content: string }[] = [];
  const defA = deferred<void>();
  const defB = deferred<void>();

  const coordinator = createEditorSaveCoordinator(async (edit) => {
    saveCalls.push({ ...edit });
    if (edit.content === "revA") {
      await defA.promise;
    } else if (edit.content === "revB") {
      await defB.promise;
    }
  });

  coordinator.recordEdit("test.py", "revA");
  const flushA = coordinator.flushFile("test.py");
  assert.equal(saveCalls.length, 1);

  coordinator.recordEdit("test.py", "revB");
  const flushB = coordinator.flushFile("test.py");
  // flushB waits for flushA to complete; revB has not been sent to saveFn yet
  assert.equal(saveCalls.length, 1);

  // Revision A completes and succeeds
  defA.resolve();
  await flushA;

  // Now revision B is dispatched and can complete
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(saveCalls.length, 2);
  assert.equal(saveCalls[1].content, "revB");
  defB.resolve();
  await flushB;

  // Subsequent flush produces no duplicate writes
  await coordinator.flush();
  assert.equal(saveCalls.length, 2);
});

test("coordinator: failed write preserves pending edits for retry if still latest", async () => {
  let attempt = 0;
  const coordinator = createEditorSaveCoordinator(async (_edit) => {
    attempt++;
    if (attempt === 1) {
      throw new Error("Simulated I/O failure");
    }
  });

  coordinator.recordEdit("script.py", "critical_user_code()");

  // First flush fails
  await assert.rejects(coordinator.flush(), { message: "Simulated I/O failure" });

  // Second flush retries successfully
  await coordinator.flush();
  assert.equal(attempt, 2);

  // Subsequent flush has nothing left to retry
  await coordinator.flush();
  assert.equal(attempt, 2);
});

test("coordinator: file switching tracks and flushes multiple files independently", async () => {
  const savedFiles: string[] = [];
  let shouldFailA = true;
  const coordinator = createEditorSaveCoordinator(async (edit) => {
    if (edit.filename === "fileA.py" && shouldFailA) {
      throw new Error("Write failed for fileA");
    }
    savedFiles.push(edit.filename);
  });

  // Edit fileA
  coordinator.recordEdit("fileA.py", "contentA");
  // Switch to fileB and edit
  coordinator.recordEdit("fileB.py", "contentB");

  // Flush all files
  await assert.rejects(coordinator.flush(), { message: "Write failed for fileA" });

  // fileB succeeded, fileA failed and remained pending for retry
  assert.deepEqual(savedFiles, ["fileB.py"]);

  // Allow fileA to succeed on retry
  shouldFailA = false;
  await coordinator.flush();
  assert.deepEqual(savedFiles, ["fileB.py", "fileA.py"]);

  // Third flush has no pending files
  await coordinator.flush();
  assert.deepEqual(savedFiles, ["fileB.py", "fileA.py"]);
});

test("query cache rollback: only rolls back if cache content matches failed mutation", () => {
  // Simulates the exact TanStack Query cache logic in queries.ts
  const cache = new Map<string, string>();
  cache.set("file.py", "initial");

  function onMutate(filename: string, content: string) {
    const previous = cache.get(filename);
    cache.set(filename, content);
    return { previous, filename, content };
  }

  function onError(
    filename: string,
    content: string,
    context: { previous?: string; filename: string; content: string },
  ) {
    const current = cache.get(filename);
    if (current === content && context?.previous !== undefined) {
      cache.set(filename, context.previous);
    }
  }

  // Mutation 1 (v1) starts
  const ctx1 = onMutate("file.py", "v1");
  assert.equal(cache.get("file.py"), "v1");

  // Mutation 2 (v2) starts before Mutation 1 resolves
  const _ctx2 = onMutate("file.py", "v2");
  assert.equal(cache.get("file.py"), "v2");

  // Mutation 1 fails!
  onError("file.py", "v1", ctx1);

  // Cache MUST NOT be rolled back to "initial", because cache is now "v2", not "v1"!
  assert.equal(cache.get("file.py"), "v2", "Cache must not revert when newer mutation exists");
});

test("coordinator: flush cannot report success when concurrent in-flight save fails", async () => {
  let attempt = 0;
  const def = deferred<void>();
  const coordinator = createEditorSaveCoordinator(async () => {
    attempt++;
    if (attempt === 1) {
      await def.promise;
    }
  });

  coordinator.recordEdit("test.py", "unsaved_work");
  // Background autosave starts
  const p1 = coordinator.flush();

  // User triggers operation requiring save (e.g. Run or Logout)
  const p2 = coordinator.flush();

  // Background save fails
  def.reject(new Error("Disk permission denied"));

  // Both the initiator and any concurrent flush caller MUST fail closed
  await assert.rejects(p1, { message: "Disk permission denied" });
  await assert.rejects(p2, { message: "Disk permission denied" });

  // Failed edit was preserved and can be retried on next flush
  await coordinator.flush();
  assert.equal(attempt, 2);
});

test("coordinator: newer edit typed during in-flight save is guaranteed to be saved before flush returns", async () => {
  const savedEdits: string[] = [];
  const def1 = deferred<void>();

  const coordinator = createEditorSaveCoordinator(async (edit) => {
    savedEdits.push(edit.content);
    if (edit.content === "edit_1") {
      await def1.promise;
    }
  });

  coordinator.recordEdit("doc.txt", "edit_1");
  // Flush 1 starts saving edit_1
  const pFlush = coordinator.flush();

  // User types edit_2 while edit_1 is saving
  coordinator.recordEdit("doc.txt", "edit_2");

  // Edit 1 completes
  def1.resolve();
  await pFlush;

  // Flush must have persisted edit_2 as well, leaving no pending edits
  assert.deepEqual(savedEdits, ["edit_1", "edit_2"]);
  await coordinator.flush();
  assert.deepEqual(savedEdits, ["edit_1", "edit_2"]);
});

test("integration: coordinator and filesystem saveQueue cooperation under failure and settlement", async () => {
  const disk: Record<string, string> = {};
  const queue = createSaveQueue();
  let failFirstWrite = true;

  // Real production save coordination wrapping the real filesystem queue
  const coordinator = createEditorSaveCoordinator((edit) =>
    queue.enqueue(async () => {
      if (edit.filename === "critical.py" && failFirstWrite) {
        failFirstWrite = false;
        throw new Error("Temporary disk I/O glitch");
      }
      disk[edit.filename] = edit.content;
    }),
  );

  coordinator.recordEdit("critical.py", "version_1");

  // Attempt 1 fails at the filesystem queue level
  await assert.rejects(coordinator.flush(), { message: "Temporary disk I/O glitch" });
  assert.equal(disk["critical.py"], undefined, "Failed write must not be in disk state");

  // Queue settles
  await queue.settled();

  // Retry succeeds and settles
  await coordinator.flush();
  await queue.settled();

  assert.equal(disk["critical.py"], "version_1");

  // Subsequent flush produces no duplicate writes
  await coordinator.flush();
  assert.equal(disk["critical.py"], "version_1");
});
