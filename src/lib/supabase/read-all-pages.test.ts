import assert from "node:assert/strict";
import test from "node:test";

import { readAllPages } from "@/lib/supabase/read-all-pages";

/** A table of `total` numbered rows that, like PostgREST, answers a range with at most the rows that exist in it. */
function table(total: number) {
  const calls: Array<[number, number]> = [];
  const readPage = async (from: number, to: number) => {
    calls.push([from, to]);
    const data: number[] = [];
    for (let i = from; i <= Math.min(to, total - 1); i += 1) data.push(i);
    return { data, error: null };
  };
  return { calls, readPage };
}

test("a table under one page is read with a single request", async () => {
  const { calls, readPage } = table(892);
  const rows = await readAllPages(readPage, 1000);
  assert.equal(rows.length, 892);
  assert.deepEqual(calls, [[0, 999]]);
});

test("a table past one page is read in full, in order, with no row lost or repeated", async () => {
  const { calls, readPage } = table(1292);
  const rows = await readAllPages(readPage, 1000);
  assert.equal(rows.length, 1292);
  assert.deepEqual(
    rows,
    Array.from({ length: 1292 }, (_, i) => i),
  );
  assert.deepEqual(calls, [
    [0, 999],
    [1000, 1999],
  ]);
});

test("a table of exactly one page asks once more and then stops", async () => {
  const { calls, readPage } = table(1000);
  const rows = await readAllPages(readPage, 1000);
  assert.equal(rows.length, 1000);
  assert.equal(calls.length, 2);
});

test("an empty table gives no rows, and an error stops the read instead of returning part of it", async () => {
  assert.deepEqual(await readAllPages(async () => ({ data: null, error: null })), []);
  await assert.rejects(
    readAllPages(async () => ({ data: null, error: { message: "boom" } })),
    (error: { message: string }) => error.message === "boom",
  );
});
