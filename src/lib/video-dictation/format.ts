/**
 * Plain helpers of the library cards. They live apart from content.ts because that file imports every
 * prepared video (all their sentences and word meanings): a component that runs in the browser must not
 * pull that into its bundle just to print a length or build a picture address.
 */

/** "1:05": a length for the library, always minutes and seconds. */
export function formatClipLength(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

/** The thumbnail YouTube serves for a video (an image on i.ytimg.com, never stored by us). */
export function thumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`;
}
