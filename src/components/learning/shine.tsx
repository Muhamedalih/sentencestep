/**
 * The small bit of life on the main button of a finish screen: a soft band of
 * light crosses it once when it is hovered or focused, and (with SHINE_LIFT) it
 * rises a little on hover and sinks on press. Pure CSS, so it costs nothing per
 * frame, and both stop for a learner who asked for less motion.
 *
 * Usage: put SHINE_BASE (or SHINE_LIFT) in the button's className and a `<Shine />`
 * as its first child — it works the same on a Button and on a Link styled as one.
 */

/** What the host carries so the band is clipped to its own shape and can be driven by its hover. */
export const SHINE_BASE = "group/shine relative overflow-hidden";

/** The same, plus the lift on hover and the press — for a button that is not already moved by something else. */
export const SHINE_LIFT = `${SHINE_BASE} hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 active:scale-[0.97] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100`;

export function Shine() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[160%] -skew-x-[20deg] bg-white/25 transition-transform duration-700 ease-out group-hover/shine:translate-x-[460%] group-focus-visible/shine:translate-x-[460%] motion-reduce:hidden"
    />
  );
}
