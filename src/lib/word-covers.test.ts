import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { hasCoverScene } from "@/components/words/word-cover-art";
import { ROLLOUTS, ROLLOUT_IDS } from "@/lib/rollouts/catalog";
import {
  COVER_ACCEPT,
  COVER_BUCKET,
  COVER_SIZE,
  COVER_TYPES,
  GROUP_ID_PATTERN,
  MAX_COVER_BYTES,
  coverPath,
  coverPathFromUrl,
  isCoverType,
} from "@/lib/word-covers";
import { CoverImageError, makeCoverImage } from "@/lib/word-covers-image";

/**
 * The picture an admin chooses as a Word List's cover: what is accepted, how the one upload
 * becomes the 4:3 cover, where it is stored, and the permission and migration around it.
 */

const publicUrl = (path: string) =>
  `https://project.supabase.co/storage/v1/object/public/${COVER_BUCKET}/${path}`;

test("a cover lives in its list's own folder and a new upload never reuses a name", () => {
  const path = coverPath("family", "abc123");
  assert.ok(path.startsWith("family/"));
  assert.ok(path.endsWith(".webp"));
  assert.notEqual(path, coverPath("family", "def456"));
});

test("a stored file's path is found again from its public URL, and only ours", () => {
  const path = coverPath("travel", "v1");
  assert.equal(coverPathFromUrl(publicUrl(path)), path);
  assert.equal(coverPathFromUrl(`${publicUrl(path)}?t=1#x`), path);
  assert.equal(
    coverPathFromUrl("https://project.supabase.co/storage/v1/object/public/book-covers/a.png"),
    null,
  );
  assert.equal(coverPathFromUrl(publicUrl("")), null);
  assert.equal(coverPathFromUrl(null), null);
  assert.equal(coverPathFromUrl(undefined), null);
  assert.equal(coverPathFromUrl(""), null);
});

test("only picture formats are accepted — never an SVG, a GIF or a document", () => {
  for (const type of COVER_TYPES) assert.ok(isCoverType(type), type);
  for (const type of ["image/svg+xml", "image/gif", "application/pdf", "text/html", ""]) {
    assert.equal(isCoverType(type), false, type);
  }
  assert.equal(COVER_ACCEPT, COVER_TYPES.join(","));
  assert.ok(MAX_COVER_BYTES >= 5 * 1024 * 1024, "a photo off a phone must fit");
});

test("only a slug can be a list id, so nothing odd reaches a Storage path", () => {
  for (const id of ["family", "money-and-business", "a_b", "Politics2"]) {
    assert.ok(GROUP_ID_PATTERN.test(id), id);
  }
  for (const id of ["", "../etc", "a/b", "a b", "x".repeat(101), "family?x=1"]) {
    assert.equal(GROUP_ID_PATTERN.test(id), false, id);
  }
});

async function picture(width: number, height: number, options: { orientation?: number } = {}) {
  const { default: sharp } = await import("sharp");
  // A gradient with some structure, so the encoder has something to do.
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      raw[offset] = (x * 255) / width;
      raw[offset + 1] = (y * 255) / height;
      raw[offset + 2] = (x + y) % 64 < 32 ? 40 : 200;
    }
  }
  let image = sharp(raw, { raw: { width, height, channels: 3 } });
  if (options.orientation) image = image.withMetadata({ orientation: options.orientation });
  return image.jpeg({ quality: 90 }).toBuffer();
}

async function describe(buffer: Buffer) {
  const { default: sharp } = await import("sharp");
  const { width, height, format } = await sharp(buffer).metadata();
  return { width, height, format };
}

test("a photo of any shape becomes the 4:3 cover, as a light WebP", async () => {
  for (const [width, height] of [
    [1800, 1200],
    [900, 1400],
    [800, 800],
  ] as const) {
    const cover = await makeCoverImage(await picture(width, height));
    assert.deepEqual(await describe(cover), {
      width: COVER_SIZE.width,
      height: COVER_SIZE.height,
      format: "webp",
    });
    assert.ok(cover.length < 120 * 1024, `the cover is light (${cover.length} bytes)`);
  }
});

test("a photo that was taken sideways is turned the right way up before it is cropped", async () => {
  // Stored as 1200 x 800 with the "rotate 90°" flag: shown as 800 x 1200, so it is a portrait.
  const cover = await makeCoverImage(await picture(1200, 800, { orientation: 6 }));
  assert.deepEqual(
    [(await describe(cover)).width, (await describe(cover)).height],
    [COVER_SIZE.width, COVER_SIZE.height],
  );
});

test("a picture too small, or not a picture at all, is refused with a reason", async () => {
  await assert.rejects(
    makeCoverImage(await picture(300, 900)),
    (error: unknown) => error instanceof CoverImageError && /too small/.test(error.message),
  );
  await assert.rejects(
    makeCoverImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")),
    (error: unknown) => error instanceof CoverImageError && /isn't a picture/.test(error.message),
  );
  await assert.rejects(makeCoverImage(Buffer.from("this is not an image")), CoverImageError);
});

test("the covers migration: one additive column and a public WebP-only bucket the server alone writes to", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20250359000000_word_group_covers.sql"),
    "utf8",
  );
  assert.match(sql, /alter table word_groups add column if not exists cover_url text/);
  assert.ok(
    sql.includes(`values ('${COVER_BUCKET}', '${COVER_BUCKET}', true,`),
    "the bucket is public",
  );
  assert.ok(sql.includes("array['image/webp']"), "only WebP is allowed in it");
  assert.ok(sql.includes("on conflict (id) do nothing"), "running it twice changes nothing");
  // Only the server (service role) writes to it: no policy lets anyone else.
  assert.doesNotMatch(sql, /create policy/i);
  assert.doesNotMatch(sql, /drop (table|column)/i, "nothing that exists is removed");
});

test("every published topic has a drawing of its own, and an unknown topic has none", () => {
  // The 24 published Word Lists, by level (the live library, 2026-11-12).
  for (const title of [
    "Family",
    "Colors",
    "Animals",
    "Food",
    "House",
    "Clothes",
    "Body",
    "Transportation",
    "Friendship",
    "Travel",
    "Health",
    "Shopping",
    "Weather",
    "Work",
    "Sports",
    "Emotions",
    "Politics",
    "Finance",
    "Technology",
    "Environment",
    "Education",
    "Media",
    "Law",
    "Science",
  ]) {
    assert.ok(hasCoverScene(title), title);
  }
  // "Gaming" was the example of a topic with no drawing until the third expansion drew it
  // (src/data/word-lists/expansion-3.test.ts keeps those sixteen honest).
  for (const title of ["A Topic Nobody Added", "", "toString", "constructor"]) {
    assert.equal(hasCoverScene(title), false, title);
  }
});

test("the permission exists and is for learners (so it is Admins only until it is opened)", () => {
  assert.ok((ROLLOUT_IDS as readonly string[]).includes("wordCovers"));
  assert.equal(ROLLOUTS.wordCovers.id, "wordCovers");
  assert.equal(ROLLOUTS.wordCovers.audience, "learner");
});
