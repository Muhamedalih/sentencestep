/**
 * The colour of a topic's book on the banner's shelf. Hand-picked from the topics' cover palettes
 * (see src/components/words/word-cover-art.tsx) so neighbouring books differ, with no yellow. A
 * topic added later takes its level's colour until it is given one here.
 */
const SPINE: Record<string, string> = {
  Family: "#4b5a8f",
  Colors: "#3a86c8",
  Animals: "#e0733f",
  Food: "#d9694a",
  House: "#3c7f86",
  Clothes: "#2f9aa0",
  Body: "#5a6fb5",
  Transportation: "#2d5f8b",
  Friendship: "#e5707e",
  Travel: "#ef6a4c",
  Health: "#e0465a",
  Shopping: "#8a6fd0",
  Weather: "#3d78b8",
  Work: "#a0643c",
  Sports: "#1f6f6a",
  Emotions: "#ee8a67",
  Politics: "#5b4fa6",
  Finance: "#2e8f6c",
  Technology: "#4a6fd1",
  Environment: "#3f9a5a",
  Education: "#4b5fc0",
  Media: "#c64f7a",
  Law: "#4f5fa8",
  Science: "#2fa39a",
};

const BY_LEVEL: Record<number, string> = { 1: "#2e8f6c", 2: "#3f6fb0", 3: "#5b4fa6" };

/** The colour of the title on every book. */
export const SPINE_TEXT = "#f7f5f0";

export function spineColor(title: string, level: number): string {
  return (
    (Object.prototype.hasOwnProperty.call(SPINE, title) ? SPINE[title] : undefined) ??
    BY_LEVEL[level] ??
    BY_LEVEL[1]!
  );
}

/** Whether a topic has a colour of its own (for the test that every published topic has one). */
export function hasSpineColor(title: string): boolean {
  return Object.prototype.hasOwnProperty.call(SPINE, title);
}
