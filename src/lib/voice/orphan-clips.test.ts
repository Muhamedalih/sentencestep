import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bucketPathFromPublicUrl,
  findOrphans,
  groupKey,
  type StoredObject,
} from "@/lib/voice/orphan-clips";

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse("2026-10-08T12:00:00Z");

function object(path: string, hoursOld: number | null): StoredObject {
  return {
    path,
    createdAt: hoursOld === null ? null : new Date(NOW - hoursOld * HOUR).toISOString(),
    size: 1000,
  };
}

describe("bucketPathFromPublicUrl", () => {
  it("extracts the bucket-relative path", () => {
    assert.equal(
      bucketPathFromPublicUrl(
        "https://x.supabase.co/storage/v1/object/public/voice-audio/generated/edge-tts/v1/a.mp3",
      ),
      "generated/edge-tts/v1/a.mp3",
    );
  });

  it("drops a query string and decodes percent-escapes", () => {
    assert.equal(
      bucketPathFromPublicUrl(
        "https://x.supabase.co/storage/v1/object/public/voice-audio/generated/a%20b/c.mp3?t=1",
      ),
      "generated/a b/c.mp3",
    );
  });

  it("returns null for another bucket or a non-storage URL", () => {
    assert.equal(
      bucketPathFromPublicUrl("https://x.supabase.co/storage/v1/object/public/book-covers/a.png"),
      null,
    );
    assert.equal(bucketPathFromPublicUrl("https://example.com/a.mp3"), null);
    assert.equal(
      bucketPathFromPublicUrl("https://x.supabase.co/storage/v1/object/public/voice-audio/"),
      null,
    );
  });
});

describe("findOrphans", () => {
  const options = { now: NOW, minAgeMs: 24 * HOUR };

  it("keeps referenced objects, however old", () => {
    const report = findOrphans(
      [object("generated/a.mp3", 500)],
      new Set(["generated/a.mp3"]),
      options,
    );
    assert.deepEqual(report.orphans, []);
    assert.equal(report.referenced, 1);
  });

  it("reports an old unreferenced object", () => {
    const report = findOrphans([object("generated/a.mp3", 48)], new Set(), options);
    assert.deepEqual(
      report.orphans.map((o) => o.path),
      ["generated/a.mp3"],
    );
  });

  it("never touches an unreferenced object younger than the minimum age", () => {
    const report = findOrphans([object("generated/new.mp3", 1)], new Set(), options);
    assert.deepEqual(report.orphans, []);
    assert.equal(report.tooNew, 1);
  });

  it("never touches an object whose age is unknown or unparseable", () => {
    const unparseable: StoredObject = { path: "b.mp3", createdAt: "not a date", size: null };
    const report = findOrphans([object("a.mp3", null), unparseable], new Set(), options);
    assert.deepEqual(report.orphans, []);
    assert.equal(report.tooNew, 2);
  });

  it("treats exactly the minimum age as old enough", () => {
    const report = findOrphans([object("edge.mp3", 24)], new Set(), options);
    assert.equal(report.orphans.length, 1);
  });

  it("orders orphans oldest first", () => {
    const report = findOrphans(
      [object("mid.mp3", 100), object("oldest.mp3", 900), object("newest.mp3", 30)],
      new Set(),
      options,
    );
    assert.deepEqual(
      report.orphans.map((o) => o.path),
      ["oldest.mp3", "mid.mp3", "newest.mp3"],
    );
  });
});

describe("groupKey", () => {
  it("groups generated clips by provider or voice folder", () => {
    assert.equal(groupKey("generated/edge-tts/voice-1/a.mp3"), "generated/edge-tts");
    assert.equal(groupKey("generated/kokoro-heart/a.mp3"), "generated/kokoro-heart");
  });

  it("groups everything else by its top-level folder", () => {
    assert.equal(groupKey("samples/kokoro-bella.mp3"), "samples");
  });
});
