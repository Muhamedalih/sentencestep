/**
 * The picture an admin chooses as a passage's background: what an upload may be, the two
 * sizes it is made into, and where the files live. Pure (no image library), so the admin's
 * browser and the server agree on the limits and a test can pin them.
 *
 * One upload becomes two files, each the size its place needs, so a learner never downloads
 * more than what is on screen:
 *
 *   poster  600 x 800 (3:4)   the poster on the Passages list, Home's card and the lock screen
 *   wide    up to 1600 px     the soft backdrop at the top of the reading page
 *
 * See background-image.ts for how they are made and src/lib/admin/passage-backgrounds.ts for
 * how they are stored.
 */

export const BACKGROUND_BUCKET = "passage-backgrounds";

/** What an upload may be: the browser's own type for the file. The server re-encodes it, so only these are ever read. */
export const BACKGROUND_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** For the file picker's `accept`. */
export const BACKGROUND_ACCEPT = BACKGROUND_TYPES.join(",");

/** A photo straight off a phone or a stock site is a few megabytes; the server shrinks it. */
export const MAX_BACKGROUND_BYTES = 12 * 1024 * 1024;

/** Both sides, in pixels: smaller than this would look soft on a poster. */
export const MIN_BACKGROUND_SIDE = 600;

/** A guard against an image that is small to send but enormous to open. */
export const MAX_BACKGROUND_PIXELS = 100_000_000;

/** The poster is always this shape. */
export const POSTER_SIZE = { width: 600, height: 800 } as const;

/** The longest side of the wide picture. */
export const WIDE_MAX_SIDE = 1600;

export function isBackgroundType(type: string): boolean {
  return (BACKGROUND_TYPES as readonly string[]).includes(type);
}

/** The two files of one upload, inside the bucket. `version` is new for every upload, so a replaced picture never comes from a cache. */
export function backgroundPaths(
  passageId: string,
  version: string,
): { poster: string; wide: string } {
  return {
    poster: `${passageId}/${version}-poster.webp`,
    wide: `${passageId}/${version}.webp`,
  };
}

/** The bucket-relative path of a file from its public URL (null for anything that isn't one of ours). */
export function backgroundPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/object/public/${BACKGROUND_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length).split(/[?#]/)[0] ?? "";
  return path === "" ? null : path;
}

/** A size in megabytes for a message ("12 MB"). */
export const MAX_BACKGROUND_LABEL = `${MAX_BACKGROUND_BYTES / (1024 * 1024)} MB`;
