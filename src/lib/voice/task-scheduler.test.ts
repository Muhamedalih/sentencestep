import assert from "node:assert/strict";
import test from "node:test";

import { TaskScheduler } from "@/lib/voice/task-scheduler";

/** A promise the test settles by hand. */
function gate<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("TaskScheduler: never runs more than `concurrency` tasks at once, and runs them all", async () => {
  const scheduler = new TaskScheduler(2);
  let active = 0;
  let peak = 0;
  const outcomes = await Promise.all(
    [1, 2, 3, 4, 5].map((n) =>
      scheduler.schedule(
        async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active -= 1;
          return n;
        },
        () => 0,
      ),
    ),
  );
  assert.equal(peak, 2);
  assert.deepEqual(
    outcomes.map((outcome) => (outcome.status === "done" ? outcome.value : null)),
    [1, 2, 3, 4, 5],
  );
});

test("TaskScheduler: the lowest rank goes first, ties in the order they were queued", async () => {
  const scheduler = new TaskScheduler(1);
  const started: string[] = [];
  const hold = gate();
  // Occupies the only slot so everything after it has to queue.
  const first = scheduler.schedule(
    () => hold.promise,
    () => 0,
  );
  const queued = (name: string, rank: number) =>
    scheduler.schedule(
      async () => {
        started.push(name);
      },
      () => rank,
    );
  const all = [queued("next-a", 1), queued("now-a", 0), queued("next-b", 1), queued("now-b", 0)];

  hold.resolve();
  await Promise.all([first, ...all]);
  assert.deepEqual(started, ["now-a", "now-b", "next-a", "next-b"]);
});

test("TaskScheduler: a rank is re-read when the queue decides, so a promotion takes effect without re-queuing", async () => {
  const scheduler = new TaskScheduler(1);
  const started: string[] = [];
  const hold = gate();
  const first = scheduler.schedule(
    () => hold.promise,
    () => 0,
  );

  let laterRank = 5;
  const early = scheduler.schedule(
    async () => {
      started.push("early");
    },
    () => 1,
  );
  const later = scheduler.schedule(
    async () => {
      started.push("later");
    },
    () => laterRank,
  );
  laterRank = 0; // the learner reached that sentence: it is now the most urgent

  hold.resolve();
  await Promise.all([first, early, later]);
  assert.deepEqual(started, ["later", "early"]);
});

test("TaskScheduler: a null rank drops the task without ever running it", async () => {
  const scheduler = new TaskScheduler(1);
  const hold = gate();
  const first = scheduler.schedule(
    () => hold.promise,
    () => 0,
  );

  let ran = false;
  let stale = false;
  const dropped = scheduler.schedule(
    async () => {
      ran = true;
    },
    () => (stale ? null : 1),
  );
  stale = true;

  hold.resolve();
  await first;
  assert.deepEqual(await dropped, { status: "dropped" });
  assert.equal(ran, false);
});

test("TaskScheduler: a failing task is reported, frees its slot and does not stop the queue", async () => {
  const scheduler = new TaskScheduler(1);
  const failing = scheduler.schedule(
    () => Promise.reject(new Error("boom")),
    () => 0,
  );
  const throwing = scheduler.schedule(
    () => {
      throw new Error("sync boom");
    },
    () => 0,
  );
  const fine = scheduler.schedule(
    () => Promise.resolve("ok"),
    () => 0,
  );

  const [a, b, c] = await Promise.all([failing, throwing, fine]);
  assert.equal(a.status, "failed");
  assert.equal(b.status, "failed");
  assert.deepEqual(c, { status: "done", value: "ok" });
});

test("TaskScheduler: a task starts as soon as a slot frees, not on a timer", async () => {
  const scheduler = new TaskScheduler(1);
  const hold = gate();
  const first = scheduler.schedule(
    () => hold.promise,
    () => 0,
  );
  let secondStarted = false;
  const second = scheduler.schedule(
    async () => {
      secondStarted = true;
    },
    () => 0,
  );

  await flush();
  assert.equal(secondStarted, false);
  hold.resolve();
  await Promise.all([first, second]);
  assert.equal(secondStarted, true);
});
