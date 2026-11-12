/**
 * The picture an admin chooses for a Word List's cover (Word Lists library, and the Words page's
 * topics): what an upload may be, the one size it is made into, and where the file lives. Pure
 * (no image library), so the admin's browser and the server agree on the limits and a test can
 * pin them.
 *
 * A list with no chosen picture shows the drawing made for its topic (see
 * src/components/words/word-cover-art.tsx), so a missing or removed picture never leaves a gap.
 *
 * One upload becomes one file, the cover's own 4:3 shape at 800 x 600, so a learner never
 * downloads more than the card shows. See word-covers-image.ts for how it is made and
 * src/lib/admin/word-group-covers.ts for how it is stored.
 */

export const COVER_BUCKET = "word-covers";

/** What an upload may be: the browser's own type for the file. The server re-encodes it, so only these are ever read. */
export const COVER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** For the file picker's `accept`. */
export const COVER_ACCEPT = COVER_TYPES.join(",");

/** A photo straight off a phone or a stock site is a few megabytes; the server shrinks it. */
export const MAX_COVER_BYTES = 12 * 1024 * 1024;

/** A size in megabytes for a message ("12 MB"). */
export const MAX_COVER_LABEL = `${MAX_COVER_BYTES / (1024 * 1024)} MB`;

/** Both sides, in pixels: smaller than this would look soft on a card. */
export const MIN_COVER_SIDE = 400;

/** A guard against an image that is small to send but enormous to open. */
export const MAX_COVER_PIXELS = 100_000_000;

/** The cover is always this shape (4:3). */
export const COVER_SIZE = { width: 800, height: 600 } as const;

/** Word group ids are slugs; anything else can't be one, so it is never looked up or used in a Storage path. */
export const GROUP_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

export function isCoverType(type: string): boolean {
  return (COVER_TYPES as readonly string[]).includes(type);
}

/** The file of one upload, inside the bucket. `version` is new for every upload, so a replaced picture never comes from a cache. */
export function coverPath(groupId: string, version: string): string {
  return `${groupId}/${version}.webp`;
}

/** The bucket-relative path of a file from its public URL (null for anything that isn't one of ours). */
export function coverPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/object/public/${COVER_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length).split(/[?#]/)[0] ?? "";
  return path === "" ? null : path;
}
