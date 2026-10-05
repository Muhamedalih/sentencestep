import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { peekInDelay, peekInTotalMs, peekOutDelay, peekOutTotalMs } from "@/lib/peek-glyph";

describe("peek-glyph timing", () => {
  it("staggers letters one after another from the first", () => {
    assert.equal(peekInDelay(0), 0);
    assert.ok(peekInDelay(1) > peekInDelay(0));
    assert.ok(peekOutDelay(1) > peekOutDelay(0));
  });

  it("caps the stagger so a long word never takes much longer than a short one", () => {
    assert.equal(peekInDelay(40), peekInDelay(400));
    assert.equal(peekOutDelay(40), peekOutDelay(400));
    assert.ok(peekInTotalMs(40) - peekInTotalMs(10) < 100);
  });

  it("takes longer to rise in and to leave for a longer word, up to the cap", () => {
    assert.ok(peekInTotalMs(8) > peekInTotalMs(2));
    assert.ok(peekOutTotalMs(8) > peekOutTotalMs(2));
  });

  it("takes no time for an empty word", () => {
    assert.equal(peekInTotalMs(0), 0);
    assert.equal(peekOutTotalMs(0), 0);
  });

  it("keeps the whole rise-in and dissolve well under a second each, like Show the word", () => {
    assert.ok(peekInTotalMs(14) < 800);
    assert.ok(peekOutTotalMs(14) < 600);
  });
});
