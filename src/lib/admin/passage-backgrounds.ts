import { randomUUID } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";

import { logAdminAction } from "@/lib/admin/audit-log";
import {
  BACKGROUND_BUCKET,
  backgroundPathFromUrl,
  backgroundPaths,
} from "@/lib/passages/background";
import { BackgroundImageError, makeBackgroundImages } from "@/lib/passages/background-image";
import { PASSAGES_CACHE_TAG } from "@/lib/passages/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Saving and removing the picture an admin chooses as a passage's background. Server side
 * only, and only ever called after the caller has checked the user is an admin (the upload
 * is a route handler, because a picture is bigger than a Server Action may carry — see
 * src/app/api/admin/passages/[passageId]/background/route.ts).
 *
 * Written through the server's own client: the passages tables are closed to everyone but
 * admins by RLS, a dev-admin cookie has no Supabase session behind it for that policy to
 * recognise, and the bucket has no Storage policies at all (see the migration).
 */

export type BackgroundResult =
  | { ok: true; posterUrl: string | null; backgroundUrl: string | null }
  | { ok: false; status: number; error: string };

const NOT_FOUND: BackgroundResult = {
  ok: false,
  status: 404,
  error: "That passage no longer exists.",
};

/** The learner's share-cached reads and the admin pages pick the change up at once. */
function refresh(passageId: string) {
  revalidateTag(PASSAGES_CACHE_TAG);
  revalidatePath("/admin/passages");
  revalidatePath(`/admin/passages/${passageId}`);
}

/** Deletes files from the bucket. A file that can't be removed is only an orphan, never a reason to fail what the admin asked for. */
export async function removeBackgroundFiles(urls: readonly (string | null)[]): Promise<void> {
  const paths = urls
    .map((url) => backgroundPathFromUrl(url))
    .filter((path): path is string => Boolean(path));
  if (paths.length === 0) return;
  const { error } = await createServiceRoleClient().storage.from(BACKGROUND_BUCKET).remove(paths);
  if (error) {
    console.error("[passages] removing background files failed", { paths, message: error.message });
  }
}

/** Makes the poster and the wide picture from an upload, stores both and points the passage at them; the passage's previous picture is deleted afterwards. */
export async function setPassageBackground(
  passageId: string,
  bytes: Buffer,
): Promise<BackgroundResult> {
  const supabase = createServiceRoleClient();

  const { data: passage, error: readError } = await supabase
    .from("passages")
    .select("id, poster_url, background_url")
    .eq("id", passageId)
    .maybeSingle();
  if (readError) {
    return { ok: false, status: 500, error: "Couldn't read the passage. Please try again." };
  }
  if (!passage) return NOT_FOUND;

  let images;
  try {
    images = await makeBackgroundImages(bytes);
  } catch (error) {
    if (error instanceof BackgroundImageError) {
      return { ok: false, status: 422, error: error.message };
    }
    console.error("[passages] processing a background failed", error);
    return {
      ok: false,
      status: 500,
      error: "Couldn't process the picture. Please try again.",
    };
  }

  const storage = supabase.storage.from(BACKGROUND_BUCKET);
  const paths = backgroundPaths(passageId, randomUUID());
  const options = { contentType: "image/webp", upsert: false, cacheControl: "31536000" };
  const [posterUpload, wideUpload] = await Promise.all([
    storage.upload(paths.poster, images.poster, options),
    storage.upload(paths.wide, images.wide, options),
  ]);
  if (posterUpload.error || wideUpload.error) {
    console.error("[passages] uploading a background failed", {
      poster: posterUpload.error?.message,
      wide: wideUpload.error?.message,
    });
    await storage.remove([paths.poster, paths.wide]);
    return { ok: false, status: 500, error: "Couldn't upload the picture. Please try again." };
  }

  const posterUrl = storage.getPublicUrl(paths.poster).data.publicUrl;
  const backgroundUrl = storage.getPublicUrl(paths.wide).data.publicUrl;
  const { error: updateError } = await supabase
    .from("passages")
    .update({
      poster_url: posterUrl,
      background_url: backgroundUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", passageId);
  if (updateError) {
    console.error("[passages] saving a background failed", updateError);
    await storage.remove([paths.poster, paths.wide]);
    return {
      ok: false,
      status: 500,
      error: "The picture was uploaded but couldn't be saved to the passage. Please try again.",
    };
  }

  await removeBackgroundFiles([passage.poster_url, passage.background_url]);
  void logAdminAction("passage.background_changed", "passage", passageId, {});
  refresh(passageId);
  return { ok: true, posterUrl, backgroundUrl };
}

/** Takes the picture off a passage (it keeps its generated colours) and deletes the files. */
export async function clearPassageBackground(passageId: string): Promise<BackgroundResult> {
  const supabase = createServiceRoleClient();

  const { data: passage, error: readError } = await supabase
    .from("passages")
    .select("id, poster_url, background_url")
    .eq("id", passageId)
    .maybeSingle();
  if (readError) {
    return { ok: false, status: 500, error: "Couldn't read the passage. Please try again." };
  }
  if (!passage) return NOT_FOUND;

  const { error } = await supabase
    .from("passages")
    .update({ poster_url: null, background_url: null, updated_at: new Date().toISOString() })
    .eq("id", passageId);
  if (error) {
    console.error("[passages] clearing a background failed", error);
    return { ok: false, status: 500, error: "Couldn't remove the picture. Please try again." };
  }

  await removeBackgroundFiles([passage.poster_url, passage.background_url]);
  void logAdminAction("passage.background_removed", "passage", passageId, {});
  refresh(passageId);
  return { ok: true, posterUrl: null, backgroundUrl: null };
}
