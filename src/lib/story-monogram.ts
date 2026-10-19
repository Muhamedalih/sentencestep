/**
 * The first letter of a story's title, drawn as a faint outline on its cover. A leading
 * "The", "A" or "An" is skipped so "The Wrong Order" gets W instead of the same T as every other
 * story that starts with "The".
 */
export function storyMonogram(title: string): string {
  const stripped = title.trim().replace(/^(the|an|a)\s+/i, "");
  return Array.from(stripped)[0]?.toUpperCase() ?? "";
}
