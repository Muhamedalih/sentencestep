import {
  MAX_BACKGROUND_PIXELS,
  MIN_BACKGROUND_SIDE,
  POSTER_SIZE,
  WIDE_MAX_SIDE,
} from "@/lib/passages/background";

/**
 * Turns the picture an admin uploaded into the two files learners are given (see
 * background.ts). Server side only: it needs the `sharp` image library, which the app already
 * ships with for its image optimizer and which is loaded here only when a picture is actually
 * processed, never with the page.
 *
 * Everything is re-encoded as WebP, so whatever the upload was (a phone's JPEG with its
 * location in the metadata, a PNG, an AVIF) only a clean picture is ever stored, turned the
 * right way up and without its metadata. The poster is cropped around what the picture is
 * about (sharp's "attention" strategy: the sharpest, most colourful area), not blindly around
 * its centre.
 */

/** A problem with the picture itself, worded for the admin who chose it. */
export class BackgroundImageError extends Error {}

export interface BackgroundImages {
  poster: Buffer;
  wide: Buffer;
}

export async function makeBackgroundImages(input: Buffer): Promise<BackgroundImages> {
  const { default: sharp } = await import("sharp");
  const open = () => sharp(input, { limitInputPixels: MAX_BACKGROUND_PIXELS }).rotate();

  let width: number | undefined;
  let height: number | undefined;
  try {
    ({ width, height } = await sharp(input, {
      limitInputPixels: MAX_BACKGROUND_PIXELS,
    }).metadata());
  } catch {
    throw new BackgroundImageError(
      "That file isn't a picture that can be read. Use a JPG, PNG, WebP or AVIF.",
    );
  }
  if (!width || !height) {
    throw new BackgroundImageError("That file isn't a picture that can be read.");
  }
  if (Math.min(width, height) < MIN_BACKGROUND_SIDE) {
    throw new BackgroundImageError(
      `That picture is too small (${width} × ${height}). Use one at least ${MIN_BACKGROUND_SIDE} pixels on each side — 1200 pixels wide or more looks best.`,
    );
  }

  try {
    const [poster, wide] = await Promise.all([
      open()
        .resize(POSTER_SIZE.width, POSTER_SIZE.height, {
          fit: "cover",
          position: sharp.strategy.attention,
        })
        .webp({ quality: 80 })
        .toBuffer(),
      open()
        .resize({
          width: WIDE_MAX_SIDE,
          height: WIDE_MAX_SIDE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 78 })
        .toBuffer(),
    ]);
    return { poster, wide };
  } catch {
    throw new BackgroundImageError("That picture couldn't be processed. Try another one.");
  }
}
