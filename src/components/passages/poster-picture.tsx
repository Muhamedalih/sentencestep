import { PICTURE_SHADE } from "@/lib/passages/art";
import { cn } from "@/lib/utils";

/**
 * A passage's own picture on its poster (see background.ts): it fills the poster, which must be
 * `relative` and `overflow-hidden`, with a shade over it so the white number, badge and title
 * stay readable on any picture. Draws nothing when the passage has no picture, and the
 * poster's generated colours — which sit behind it, and show while the picture loads — are
 * all there is.
 *
 * `blurred` is for a passage the viewer can't open: the picture is thoroughly out of focus
 * (and enlarged a little, so the blur never leaves a soft transparent rim at the poster's
 * edges), keeping its colours as a teaser while what it shows stays unreadable. The shade
 * and everything painted over the picture stay sharp.
 *
 * Put it before the poster's own content, which then paints over it.
 */
export function PosterPicture({ src, blurred = false }: { src: string | null; blurred?: boolean }) {
  if (!src) return null;
  return (
    <>
      {/* The file is already the poster's size (600 x 800, made when it was uploaded), so the image optimizer would only resize it again. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={600}
        height={800}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={cn("absolute inset-0 size-full object-cover", blurred && "scale-125 blur-xl")}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundImage: PICTURE_SHADE }}
      />
    </>
  );
}
