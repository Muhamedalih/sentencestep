import { COVER_SIZE, MAX_COVER_PIXELS, MIN_COVER_SIDE } from "@/lib/word-covers";

/**
 * Turns the picture an admin uploaded into the one file learners are given (see word-covers.ts).
 * Server side only: it needs the `sharp` image library, which the app already ships with for its
 * image optimizer and which is loaded here only when a picture is actually processed, never with
 * the page.
 *
 * Everything is re-encoded as WebP, so whatever the upload was (a phone's JPEG with its location
 * in the metadata, a PNG, an AVIF) only a clean picture is ever stored, turned the right way up
 * and without its metadata. The crop follows what the picture is about (sharp's "attention"
 * strategy: the sharpest, most colourful area), not blindly its centre.
 */

/** A problem with the picture itself, worded for the admin who chose it. */
export class CoverImageError extends Error {}

export async function makeCoverImage(input: Buffer): Promise<Buffer> {
  const { default: sharp } = await import("sharp");

  let width: number | undefined;
  let height: number | undefined;
  try {
    ({ width, height } = await sharp(input, { limitInputPixels: MAX_COVER_PIXELS }).metadata());
  } catch {
    throw new CoverImageError(
      "That file isn't a picture that can be read. Use a JPG, PNG, WebP or AVIF.",
    );
  }
  if (!width || !height) {
    throw new CoverImageError("That file isn't a picture that can be read.");
  }
  if (Math.min(width, height) < MIN_COVER_SIDE) {
    throw new CoverImageError(
      `That picture is too small (${width} × ${height}). Use one at least ${MIN_COVER_SIDE} pixels on each side — 800 pixels wide or more looks best.`,
    );
  }

  try {
    return await sharp(input, { limitInputPixels: MAX_COVER_PIXELS })
      .rotate()
      .resize(COVER_SIZE.width, COVER_SIZE.height, {
        fit: "cover",
        position: sharp.strategy.attention,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new CoverImageError("That picture couldn't be processed. Try another one.");
  }
}
