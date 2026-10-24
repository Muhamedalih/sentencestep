import assert from "node:assert/strict";
import test from "node:test";

import { solveFitZoom } from "@/lib/today/fit-zoom";

const range = { min: 1, max: 1.5 };

test("a height that grows in proportion fills the room, to two decimals", () => {
  const zoom = solveFitZoom((z) => 500 * z, 650, range);
  assert.equal(zoom, 1.3);
});

test("text that wraps more as it grows still ends up fitting", () => {
  const height = (z: number) => 500 * z + 40 * z * z;
  const zoom = solveFitZoom(height, 700, range);
  assert.ok(height(zoom) <= 700, `height ${height(zoom)} should fit in 700`);
  assert.ok(height(zoom + 0.02) > 700 - 10, "and it should not leave much room unused");
});

test("it never goes above the largest zoom, however much room there is", () => {
  assert.equal(
    solveFitZoom((z) => 300 * z, 2000, range),
    1.5,
  );
});

test("it never goes below the smallest zoom: a screen too short keeps it", () => {
  assert.equal(
    solveFitZoom((z) => 800 * z, 600, range),
    1,
  );
});

test("no room, or a measure that gives nothing, falls back to the smallest zoom", () => {
  assert.equal(
    solveFitZoom((z) => 500 * z, 0, range),
    1,
  );
  assert.equal(
    solveFitZoom((z) => 500 * z, Number.NaN, range),
    1,
  );
  assert.equal(
    solveFitZoom(() => 0, 600, range),
    1,
  );
});
