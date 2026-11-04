import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cardHint } from "./hints";

describe("cardHint", () => {
  it("drops the full stop of the written hint", () => {
    assert.equal(cardHint("الزوجة."), "الزوجة");
    assert.equal(cardHint("  نائم.  "), "نائم");
  });

  it("leaves out an empty or oversized hint", () => {
    assert.equal(cardHint(""), null);
    assert.equal(cardHint("."), null);
    assert.equal(cardHint(null), null);
    assert.equal(cardHint("ك".repeat(49)), null);
  });
});
