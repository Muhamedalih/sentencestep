/**
 * A tiny priority queue with a concurrency cap, for background network work.
 *
 * Why it exists: browsers and this app's backend both handle a burst of small
 * requests badly (see PronunciationSettingsProvider's history), and a burst of
 * word-audio requests must never delay the one the learner is waiting for. So
 * work is ranked — the current sentence's words ahead of the next sentence's —
 * and only `concurrency` tasks ever run at once.
 *
 * `rank` is a function, not a number, and is re-read every time the queue
 * decides what runs next. A caller changing its mind (the learner moved on, so
 * this sentence's work is now stale; or the learner reached the sentence that
 * was only "next") just changes what its rank returns — nothing already queued
 * has to be found and re-prioritized.
 */

/** Lower runs sooner. `null` drops the task without running it. */
export type TaskRank = () => number | null;

export type TaskOutcome<T> =
  { status: "done"; value: T } | { status: "dropped" } | { status: "failed"; error: unknown };

interface QueuedTask {
  sequence: number;
  rank: TaskRank;
  start: () => void;
  drop: () => void;
}

export class TaskScheduler {
  private readonly queue: QueuedTask[] = [];
  private active = 0;
  private sequence = 0;

  constructor(private readonly concurrency: number) {}

  /** Runs `run` once a slot is free, best rank first; resolves with how it ended (never rejects). */
  schedule<T>(run: () => Promise<T>, rank: TaskRank): Promise<TaskOutcome<T>> {
    return new Promise((resolve) => {
      const finish = (outcome: TaskOutcome<T>) => {
        this.active -= 1;
        resolve(outcome);
        this.pump();
      };
      this.queue.push({
        sequence: this.sequence++,
        rank,
        start: () => {
          this.active += 1;
          // `run` may throw synchronously as well as reject.
          Promise.resolve()
            .then(run)
            .then(
              (value) => finish({ status: "done", value }),
              (error: unknown) => finish({ status: "failed", error }),
            );
        },
        drop: () => resolve({ status: "dropped" }),
      });
      this.pump();
    });
  }

  /** Starts as many queued tasks as the cap allows, best rank first (ties in the order they were queued). */
  private pump(): void {
    while (this.active < this.concurrency) {
      let best: { task: QueuedTask; rank: number } | null = null;
      for (const task of [...this.queue]) {
        const rank = task.rank();
        if (rank === null) {
          this.queue.splice(this.queue.indexOf(task), 1);
          task.drop();
        } else if (
          best === null ||
          rank < best.rank ||
          (rank === best.rank && task.sequence < best.task.sequence)
        ) {
          best = { task, rank };
        }
      }
      if (best === null) return;
      this.queue.splice(this.queue.indexOf(best.task), 1);
      best.task.start();
    }
  }
}
