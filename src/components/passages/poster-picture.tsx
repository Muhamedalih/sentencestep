import { PICTURE_SHADE } from "@/lib/passages/art";

/**
 * A passage's own picture on its poster (see background.ts): it fills the poster, which must be
 * `relative` and `overflow-hidden`, with a shade over it so the white number, badge and title
 * stay readable on any picture. Draws nothing when the passage has no picture, and the
 * poster's generated colours — which sit behind it, and show while the picture loads — are
 * all there is.
 *
 * Put it before the poster's own content, which then paints over it.
 */
export function PosterPicture({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    <>
      {/* The file is already the poster's size (600 x 800, made when it was uploaded), so the image optimizer would only resize it again. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundImage: PICTURE_SHADE }}
      />
    </>
  );
}
