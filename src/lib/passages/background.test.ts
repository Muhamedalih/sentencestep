import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { isSameOrigin } from "@/lib/admin/same-origin";
import {
  BACKGROUND_ACCEPT,
  BACKGROUND_BUCKET,
  BACKGROUND_TYPES,
  MAX_BACKGROUND_BYTES,
  POSTER_SIZE,
  WIDE_MAX_SIDE,
  backgroundPathFromUrl,
  backgroundPaths,
  isBackgroundType,
} from "@/lib/passages/background";
import { BackgroundImageError, makeBackgroundImages } from "@/lib/passages/background-image";

/**
 * The picture an admin chooses as a passage's background: what is accepted, how the one upload
 * becomes a poster and a wide backdrop, and the request check the upload route relies on.
 */

const publicUrl = (path: string) =>
  `https://project.supabase.co/storage/v1/object/public/${BACKGROUND_BUCKET}/${path}`;

test("the two files of an upload live in the passage's own folder and never share a name", () => {
  const paths = backgroundPaths("the-escape-room", "abc123");
  assert.ok(paths.poster.startsWith("the-escape-room/"));
  assert.ok(paths.wide.startsWith("the-escape-room/"));
  assert.notEqual(paths.poster, paths.wide);
  assert.ok(paths.poster.endsWith(".webp") && paths.wide.endsWith(".webp"));
  // A new upload is a new name, so a replaced picture can never come out of a cache.
  assert.notEqual(paths.wide, backgroundPaths("the-escape-room", "def456").wide);
});

test("a stored file's path is found again from its public URL, and only ours", () => {
  const paths = backgroundPaths("push-or-pull", "v1");
  assert.equal(backgroundPathFromUrl(publicUrl(paths.poster)), paths.poster);
  assert.equal(backgroundPathFromUrl(`${publicUrl(paths.wide)}?t=1#x`), paths.wide);
  assert.equal(
    backgroundPathFromUrl("https://project.supabase.co/storage/v1/object/public/book-covers/a.png"),
    null,
  );
  assert.equal(backgroundPathFromUrl(publicUrl("")), null);
  assert.equal(backgroundPathFromUrl(null), null);
  assert.equal(backgroundPathFromUrl(undefined), null);
  assert.equal(backgroundPathFromUrl(""), null);
});

test("only picture formats are accepted — never an SVG, a GIF or a document", () => {
  for (const type of BACKGROUND_TYPES) assert.ok(isBackgroundType(type), type);
  for (const type of ["image/svg+xml", "image/gif", "application/pdf", "text/html", ""]) {
    assert.equal(isBackgroundType(type), false, type);
  }
  assert.equal(BACKGROUND_ACCEPT, BACKGROUND_TYPES.join(","));
  assert.ok(MAX_BACKGROUND_BYTES >= 5 * 1024 * 1024, "a photo off a phone must fit");
});

function request(headers: Record<string, string>): Request {
  return { headers: new Headers(headers) } as unknown as Request;
}

test("a request is from this site only when its Origin is the host it was sent to", () => {
  const own = { origin: "https://sentencestep.com", host: "sentencestep.com" };
  assert.equal(isSameOrigin(request(own)), true);
  // Behind Cloudflare and the web server the forwarded host is the public one.
  assert.equal(
    isSameOrigin(
      request({
        origin: "https://sentencestep.com",
        host: "app:3000",
        "x-forwarded-host": "sentencestep.com",
      }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(
      request({
        origin: "https://sentencestep.com",
        "x-forwarded-host": "sentencestep.com, proxy",
      }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(request({ origin: "http://localhost:3000", host: "localhost:3000" })),
    true,
  );

  assert.equal(
    isSameOrigin(request({ origin: "https://evil.example", host: "sentencestep.com" })),
    false,
  );
  assert.equal(
    isSameOrigin(
      request({ origin: "https://sentencestep.com.evil.example", host: "sentencestep.com" }),
    ),
    false,
  );
  assert.equal(isSameOrigin(request({ host: "sentencestep.com" })), false, "no Origin at all");
  assert.equal(isSameOrigin(request({ origin: "not a url", host: "sentencestep.com" })), false);
  assert.equal(isSameOrigin(request({ origin: "https://sentencestep.com" })), false, "no host");
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

test("a landscape photo becomes a 3:4 poster and a wide picture, both WebP", async () => {
  const { poster, wide } = await makeBackgroundImages(await picture(1800, 1200));
  assert.deepEqual(await describe(poster), {
    width: POSTER_SIZE.width,
    height: POSTER_SIZE.height,
    format: "webp",
  });
  assert.deepEqual(await describe(wide), { width: 1600, height: 1067, format: "webp" });
  assert.ok(poster.length < 150 * 1024, `the poster is light (${poster.length} bytes)`);
});

test("a picture is never enlarged for the wide file, and a huge one is cut down to the limit", async () => {
  const small = await describe((await makeBackgroundImages(await picture(900, 700))).wide);
  assert.deepEqual([small.width, small.height], [900, 700]);

  const big = await describe((await makeBackgroundImages(await picture(3200, 2400))).wide);
  assert.ok(Math.max(big.width ?? 0, big.height ?? 0) <= WIDE_MAX_SIDE);
});

test("a photo that was taken sideways is turned the right way up", async () => {
  // Stored as 1200 x 800 with the "rotate 90°" flag: it is shown as 800 x 1200.
  const { wide } = await makeBackgroundImages(await picture(1200, 800, { orientation: 6 }));
  const shown = await describe(wide);
  assert.deepEqual([shown.width, shown.height], [800, 1200]);
});

test("a picture too small, or not a picture at all, is refused with a reason", async () => {
  await assert.rejects(
    makeBackgroundImages(await picture(500, 900)),
    (error: unknown) => error instanceof BackgroundImageError && /too small/.test(error.message),
  );
  await assert.rejects(
    makeBackgroundImages(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")),
    (error: unknown) =>
      error instanceof BackgroundImageError && /isn't a picture/.test(error.message),
  );
  await assert.rejects(
    makeBackgroundImages(Buffer.from("this is not an image")),
    BackgroundImageError,
  );
});

test("the backgrounds migration: two additive columns and a public WebP-only bucket the server alone writes to", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20250338000000_passage_backgrounds.sql"),
    "utf8",
  );
  assert.match(sql, /alter table passages add column if not exists poster_url text/);
  assert.match(sql, /alter table passages add column if not exists background_url text/);
  assert.ok(
    sql.includes(`values ('${BACKGROUND_BUCKET}', '${BACKGROUND_BUCKET}', true,`),
    "the bucket is public",
  );
  assert.ok(sql.includes("array['image/webp']"), "only WebP is allowed in it");
  assert.ok(sql.includes("on conflict (id) do nothing"), "running it twice changes nothing");
  // Only the server (service role) writes to it: no policy lets anyone else.
  assert.doesNotMatch(sql, /create policy/i);
  assert.doesNotMatch(sql, /drop (table|column)/i, "nothing that exists is removed");
});
