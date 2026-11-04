import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { countFinishedVideos, isMissingFinishesSchema, parseVideoFinishId } from "./finishes";

const known = new Set(["ducks-in-the-rain", "anting"]);

describe("parseVideoFinishId", () => {
  it("accepts the id of a prepared video", () => {
    assert.equal(parseVideoFinishId("anting", known), "anting");
  });

  it("drops anything that is not a prepared video's id", () => {
    assert.equal(parseVideoFinishId("nope", known), null);
    assert.equal(parseVideoFinishId("", known), null);
    assert.equal(parseVideoFinishId(42, known), null);
    assert.equal(parseVideoFinishId(null, known), null);
    assert.equal(parseVideoFinishId("a".repeat(121), new Set(["a".repeat(121)])), null);
  });
});

describe("countFinishedVideos", () => {
  it("counts each video once and only those the library still has", () => {
    assert.equal(countFinishedVideos(["anting", "anting", "gone", "ducks-in-the-rain"], known), 2);
  });

  it("is 0 with nothing finished", () => {
    assert.equal(countFinishedVideos([], known), 0);
  });
});

describe("isMissingFinishesSchema", () => {
  it("recognises a missing table and nothing else", () => {
    assert.equal(isMissingFinishesSchema({ code: "42P01", message: "x" }), true);
    assert.equal(isMissingFinishesSchema({ code: "PGRST205", message: "x" }), true);
    assert.equal(
      isMissingFinishesSchema({ code: "XX", message: 'relation "video_finishes" does not exist' }),
      true,
    );
    assert.equal(isMissingFinishesSchema({ code: "23505", message: "duplicate" }), false);
    assert.equal(isMissingFinishesSchema(null), false);
  });
});
