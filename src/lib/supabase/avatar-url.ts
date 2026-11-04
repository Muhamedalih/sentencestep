/**
 * The profile picture Google puts in a learner's sign-in token (`avatar_url`, or `picture`), or null.
 * Only an https address on Google's own picture host is accepted, so nothing else can ever be drawn
 * from a field a learner can edit.
 */
export function googleAvatarUrl(metadata: Record<string, unknown> | undefined): string | null {
  const raw = metadata?.avatar_url ?? metadata?.picture;
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname.endsWith(".googleusercontent.com")
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
