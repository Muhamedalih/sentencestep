/**
 * Pure helpers behind scripts/cleanup-orphan-voice-clips.ts — kept free of any
 * import so they can be unit-tested (orphan-clips.test.ts) without a Supabase
 * client, and so the one rule that decides what may be DELETED lives in a
 * single, tested place.
 *
 * An "orphan" is a Storage object in the voice-audio bucket that no database
 * row points at. Generated clips are uploaded under a random-UUID path
 * (storage.ts's generatedClipPath and friends) BEFORE the cache row learns that
 * path, so a clip uploaded moments ago legitimately has no reference yet —
 * findOrphans therefore never reports an object younger than `minAgeMs`, and
 * never one whose age it cannot determine.
 */

export const VOICE_AUDIO_BUCKET = "voice-audio";

export interface StoredObject {
  /** Bucket-relative path, e.g. `generated/edge-tts/<voiceId>/<uuid>.mp3`. */
  path: string;
  /** ISO timestamp from Storage's listing, or null when it didn't give one. */
  createdAt: string | null;
  size: number | null;
}

/**
 * The bucket-relative path inside a Storage public URL, or null for anything
 * that isn't one for this bucket. Drops a query string and decodes
 * percent-escapes so the result compares equal to the name Storage's listing
 * returns for the same object.
 */
export function bucketPathFromPublicUrl(
  url: string,
  bucket: string = VOICE_AUDIO_BUCKET,
): string | null {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  const raw = url.slice(index + marker.length).split("?")[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export interface OrphanReport {
  /** Unreferenced and old enough to delete, oldest first. */
  orphans: StoredObject[];
  /** Unreferenced but too new (or of unknown age) to touch yet. */
  tooNew: number;
  referenced: number;
}

export function findOrphans(
  objects: readonly StoredObject[],
  referencedPaths: ReadonlySet<string>,
  { now, minAgeMs }: { now: number; minAgeMs: number },
): OrphanReport {
  const orphans: StoredObject[] = [];
  let tooNew = 0;
  let referenced = 0;

  for (const object of objects) {
    if (referencedPaths.has(object.path)) {
      referenced += 1;
      continue;
    }
    const createdAt = object.createdAt ? Date.parse(object.createdAt) : Number.NaN;
    if (Number.isNaN(createdAt) || now - createdAt < minAgeMs) {
      tooNew += 1;
      continue;
    }
    orphans.push(object);
  }

  orphans.sort((a, b) => Date.parse(a.createdAt!) - Date.parse(b.createdAt!));
  return { orphans, tooNew, referenced };
}

/** The folder an object is reported under: `generated/<provider-or-voice>` or the top-level folder. */
export function groupKey(path: string): string {
  const [first = path, second] = path.split("/");
  return first === "generated" && second ? `generated/${second}` : first;
}
