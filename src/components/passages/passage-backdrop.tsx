/** The picture is strongest at the very top and gone before the text it sits behind: it never has to compete with it. */
const FADE = "linear-gradient(to bottom, #000 0%, #000 30%, transparent 100%)";

/**
 * The passage's own picture (see background.ts) as a quiet backdrop at the top of its reading
 * page: faded into the page, and light enough that the title, the buttons and the text keep
 * the page's own colours and stay as readable as ever, on a dark picture in the light theme
 * and on a bright one in the dark. It scrolls away with the page and takes no room — nothing
 * on the page moves for it. Draws nothing without a picture.
 *
 * The page it sits in must be `relative isolate`: the backdrop paints above that page's own
 * background and below everything on it.
 */
export function PassageBackdrop({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden sm:h-96"
    >
      {/* Already sized when it was uploaded (see background-image.ts); decoration only, so it never competes with the text for the network. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        decoding="async"
        fetchPriority="low"
        draggable={false}
        className="size-full object-cover opacity-30 dark:opacity-25"
        style={{ maskImage: FADE, WebkitMaskImage: FADE }}
      />
    </div>
  );
}
