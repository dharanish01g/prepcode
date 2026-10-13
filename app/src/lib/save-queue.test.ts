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
  assert.equal(coordinator.getLatestRevision("app.py"), 1);
  const flushA = coordinator.flushFile("app.py");

  assert.equal(saveCalls.length, 1);
  assert.equal(saveCalls[0].content, "revA");

  // 2. The user types revision B.
  coordinator.recordEdit("app.py", "revB");
  assert.equal(coordinator.getLatestRevision("app.py"), 2);

  // 3. Revision B begins saving before A finishes.
  const flushB = coordinator.flushFile("app.py");
  assert.equal(saveCalls.length, 2);
  assert.equal(saveCalls[1].content, "revB");

  // 4. A fails after B has been scheduled or started.
  defA.reject(new Error("I/O error during save of revision A"));
  await assert.rejects(flushA, { message: "I/O error during save of revision A" });

  // 5. B succeeds.
  defB.resolve();
  await flushB;

  // 6. A later flush must never write revision A over revision B.
  assert.equal(
    coordinator.hasPending("app.py"),
    false,
    "Revision A must not be requeued or pending after B succeeded",
  );
  await coordinator.flush("app.py");
  assert.equal(saveCalls.length, 2, "No subsequent write should overwrite revision B");
  assert.equal(coordinator.getSavedRevision("app.py"), 2);
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
  assert.equal(coordinator.hasPending("app.py"), false);
  assert.equal(coordinator.getSavedRevision("app.py"), 1);
});

test("coordinator: rapid typing coalesces intermediate edits and saves latest revision", async () => {
  const savedEdits: string[] = [];
  const coordinator = createEditorSaveCoordinator(async (edit) => {
    savedEdits.push(edit.content);
  });

  for (let i = 1; i <= 5; i++) {
    coordinator.recordEdit("app.py", `typed_v${i}`);
  }

  assert.equal(coordinator.getLatestRevision("app.py"), 5);
  assert.equal(coordinator.getPending("app.py")?.content, "typed_v5");

  await coordinator.flush();

  assert.deepEqual(savedEdits, ["typed_v5"]);
  assert.equal(coordinator.getSavedRevision("app.py"), 5);
  assert.equal(coordinator.hasPending("app.py"), false);
});

test("coordinator: out-of-order completion does not allow older save to overwrite newer save", async () => {
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

  coordinator.recordEdit("test.py", "revB");
  const flushB = coordinator.flushFile("test.py");

  // Revision B completes and succeeds first (out of order completion)
  defB.resolve();
  await flushB;
  assert.equal(coordinator.getSavedRevision("test.py"), 2);

  // Revision A completes second and fails
  defA.reject(new Error("Late failure of rev A"));
  await assert.rejects(flushA, { message: "Late failure of rev A" });

  // Coordinator must never requeue rev A over rev B
  assert.equal(coordinator.hasPending("test.py"), false);
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
  assert.equal(coordinator.getLatestRevision("script.py"), 1);

  // First flush fails
  await assert.rejects(coordinator.flush(), { message: "Simulated I/O failure" });
  assert.equal(
    coordinator.hasPending("script.py"),
    true,
    "Failed edit must be retained in pending",
  );
  assert.equal(coordinator.getPending("script.py")?.content, "critical_user_code()");

  // Second flush retries successfully
  await coordinator.flush();
  assert.equal(attempt, 2);
  assert.equal(coordinator.hasPending("script.py"), false);
  assert.equal(coordinator.getSavedRevision("script.py"), 1);
});

test("coordinator: file switching tracks and flushes multiple files independently", async () => {
  const savedFiles: string[] = [];
  const coordinator = createEditorSaveCoordinator(async (edit) => {
    if (edit.filename === "fileA.py") {
      throw new Error("Write failed for fileA");
    }
    savedFiles.push(edit.filename);
  });

  // Edit fileA
  coordinator.recordEdit("fileA.py", "contentA");
  // Switch to fileB and edit
  coordinator.recordEdit("fileB.py", "contentB");

  assert.equal(coordinator.hasPending("fileA.py"), true);
  assert.equal(coordinator.hasPending("fileB.py"), true);

  // Flush all files
  await assert.rejects(coordinator.flush(), { message: "Write failed for fileA" });

  // fileB succeeded, fileA failed and remained pending for retry
  assert.deepEqual(savedFiles, ["fileB.py"]);
  assert.equal(coordinator.hasPending("fileA.py"), true);
  assert.equal(coordinator.hasPending("fileB.py"), false);
  assert.equal(coordinator.getSavedRevision("fileB.py"), 1);
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
