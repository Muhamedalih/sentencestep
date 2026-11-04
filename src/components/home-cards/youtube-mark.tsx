import { HOME_CARD_COLORS, VIDEO_SCENE } from "./palette";

/** The two shapes of YouTube's play icon (a viewBox of 28.57 x 20): the rounded body and the triangle. */
const BODY =
  "M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5701 5.35042 27.9727 3.12324Z";
const TRIANGLE = "M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z";

/** YouTube's play icon, unaltered: red body, white triangle. `bodyClassName` lets a caller recolour the body at rest. */
export function YouTubeIcon({
  className,
  bodyClassName,
}: {
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <svg viewBox="0 0 28.57 20" className={className} aria-hidden="true" focusable="false">
      <path className={bodyClassName} d={BODY} fill={bodyClassName ? undefined : VIDEO_SCENE.red} />
      <path d={TRIANGLE} fill="#fff" />
    </svg>
  );
}

/**
 * The small «YouTube» tag in the Video card's corner, beside the kind tag: it says where the clips
 * come from. Dark like the kind tag; the icon's red is the only colour in it.
 */
export function YouTubeTag() {
  const colors = HOME_CARD_COLORS.video;
  return (
    <span
      dir="ltr"
      className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold"
      style={{
        background: colors.chip,
        borderColor: colors.chipEdge,
        color: "rgba(255,255,255,0.86)",
      }}
    >
      <YouTubeIcon className="h-[11px] w-auto" />
      YouTube
    </span>
  );
}
