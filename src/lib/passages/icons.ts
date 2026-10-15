/**
 * The icon keys a passage may use for its card — names only, kept free of any
 * React import so the content validator and the insert script can check them.
 * The matching lucide components live in src/components/passages/passage-icons.tsx;
 * a key missing there falls back to a generic book icon, never a crash.
 */
export const PASSAGE_ICON_KEYS = [
  "cat",
  "camera",
  "pizza",
  "smartphone",
  "wallet",
  "mail",
  "map",
  "music",
  "waves",
  "dumbbell",
  "coffee",
  "plane",
  "heart",
  "sun",
  "briefcase",
  "house",
  "book",
] as const;

export type PassageIconKey = (typeof PASSAGE_ICON_KEYS)[number];

export function isPassageIconKey(value: string): value is PassageIconKey {
  return (PASSAGE_ICON_KEYS as readonly string[]).includes(value);
}
