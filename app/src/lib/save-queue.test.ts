/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";
import { createSaveQueue } from "./save-queue.ts";

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

test("editor flush coordinator: overlapping flush requests do not duplicate writes", async () => {
  // Simulates the flush coordinator state in FileEditor and PracticeEditor
  let pending: { filename: string; content: string } | null = {
    filename: "app.py",
    content: "print('hello')",
  };
  let inflight: Promise<void> | null = null;
  let writeCount = 0;

  async function mockSaveAsync(_edit: { filename: string; content: string }) {
    writeCount++;
    await new Promise((r) => setTimeout(r, 30));
  }

  async function flush() {
    if (pending) {
      const edit = pending;
      pending = null;
      const task = (async () => {
        try {
          await mockSaveAsync(edit);
        } catch (err) {
          if (!pending) pending = edit;
          throw err;
        }
      })();
      inflight = task;
      try {
        await task;
      } finally {
        if (inflight === task) inflight = null;
      }
    } else if (inflight) {
      await inflight;
    }
  }

  // Two simultaneous flush calls (e.g. Run clicked while autosave flush initiated)
  const [f1, f2] = await Promise.all([flush(), flush()]);
  await Promise.all([f1, f2]);

  assert.equal(writeCount, 1, "Only one disk write should occur for concurrent flushes");
  assert.equal(pending, null, "Pending content cleared after successful flush");
});

test("editor flush coordinator: failed save preserves pending edits without data loss", async () => {
  let pending: { filename: string; content: string } | null = {
    filename: "script.py",
    content: "critical_user_code()",
  };
  let inflight: Promise<void> | null = null;
  let attempt = 0;

  async function mockSaveAsync(edit: { filename: string; content: string }) {
    attempt++;
    if (attempt === 1) {
      throw new Error("Simulated I/O failure");
    }
    // Succeeded on retry
    return edit;
  }

  async function flush() {
    if (pending) {
      const edit = pending;
      pending = null;
      const task = (async () => {
        try {
          await mockSaveAsync(edit);
        } catch (err) {
          if (!pending) pending = edit;
          throw err;
        }
      })();
      inflight = task;
      try {
        await task;
      } finally {
        if (inflight === task) inflight = null;
      }
    } else if (inflight) {
      await inflight;
    }
  }

  // First flush fails
  await assert.rejects(flush(), { message: "Simulated I/O failure" });
  assert.notEqual(pending, null, "Failed edit must be retained in pending ref");
  assert.equal(pending?.content, "critical_user_code()");

  // Second flush retries successfully
  await flush();
  assert.equal(attempt, 2);
  assert.equal(pending, null, "Pending edit successfully saved on second flush");
});

test("editor flush coordinator: newer edit is never overwritten by failed older save", async () => {
  let pending: { filename: string; content: string } | null = {
    filename: "main.ts",
    content: "older_edit",
  };
  let inflight: Promise<void> | null = null;

  async function flush() {
    if (pending) {
      const edit = pending;
      pending = null;
      const task = (async () => {
        try {
          await new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Old write failed")), 20),
          );
        } catch (err) {
          if (!pending) pending = edit;
          throw err;
        }
      })();
      inflight = task;
      try {
        await task;
      } finally {
        if (inflight === task) inflight = null;
      }
    } else if (inflight) {
      await inflight;
    }
  }

  const flushPromise = flush();

  // User immediately continues typing while the old write was in flight
  pending = { filename: "main.ts", content: "newer_edit_typed_by_user" };

  await assert.rejects(flushPromise, { message: "Old write failed" });

  // Verify that the newer edit was NOT overwritten by older_edit
  assert.equal(
    pending?.content,
    "newer_edit_typed_by_user",
    "Newer edit must be preserved despite older save failure",
  );
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
