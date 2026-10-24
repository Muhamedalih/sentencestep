/**
 * The largest zoom, between `min` and `max`, at which something whose height depends on the zoom
 * still fits in `available`. Pure: `measure(zoom)` is how the caller sets the zoom and reads the
 * height back (in the browser, a DOM measurement), so the search is tested without a DOM.
 *
 * The height grows with the zoom, a little faster than in proportion once text has to wrap, so the
 * first guess is the proportional one, corrected a few times, and a last guard steps the zoom
 * down until the measured height really fits (or `min` is reached — a screen too small for even
 * that simply keeps `min`, and the page scrolls as it always did).
 */
export function solveFitZoom(
  measure: (zoom: number) => number,
  available: number,
  { min, max }: { min: number; max: number },
): number {
  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  if (!Number.isFinite(available) || available <= 0) return min;
  let zoom = clamp(1);
  for (let round = 0; round < 4; round++) {
    const height = measure(zoom);
    if (!Number.isFinite(height) || height <= 0) return clamp(zoom);
    const next = clamp((zoom * available) / height);
    if (Math.abs(next - zoom) < 0.005) break;
    zoom = next;
  }
  // Rounded down to two decimals, then stepped down while it still does not fit.
  zoom = clamp(Math.floor(zoom * 100) / 100);
  for (let guard = 0; guard < 40 && zoom > min && measure(zoom) > available; guard++) {
    zoom = clamp(Math.round((zoom - 0.01) * 100) / 100);
  }
  return zoom;
}
