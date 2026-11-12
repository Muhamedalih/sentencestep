import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/admin/audit-log";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { COVER_BUCKET, coverPath, coverPathFromUrl } from "@/lib/word-covers";
import { CoverImageError, makeCoverImage } from "@/lib/word-covers-image";

/**
 * Saving and removing the picture an admin chooses as a Word List's cover. Server side only, and
 * only ever called after the caller has checked the user is an admin (the upload is a route
 * handler, because a picture is bigger than a Server Action may carry — see
 * src/app/api/admin/word-groups/[groupId]/cover/route.ts).
 *
 * Written through the server's own client: a dev-admin cookie has no Supabase session behind it
 * for RLS to recognise, and the bucket has no Storage policies at all (see the migration).
 */

export type CoverResult =
  { ok: true; coverUrl: string | null } | { ok: false; status: number; error: string };

const NOT_FOUND: CoverResult = {
  ok: false,
  status: 404,
  error: "That word list no longer exists.",
};

/** Postgres' "undefined column": the covers migration has not been applied to this database yet. */
const MISSING_COLUMN = "42703";

const NEEDS_MIGRATION: CoverResult = {
  ok: false,
  status: 503,
  error:
    "Covers aren't set up on this database yet (migration 20250359000000_word_group_covers.sql).",
};

/** The learner pages are dynamic, but the Word Lists page is told anyway so the change shows at once. */
function refresh() {
  revalidatePath("/learn/word-lists");
  revalidatePath("/admin/word-lists");
}

/** Deletes a file from the bucket. A file that can't be removed is only an orphan, never a reason to fail what the admin asked for. */
async function removeCoverFile(url: string | null): Promise<void> {
  const path = coverPathFromUrl(url);
  if (!path) return;
  const { error } = await createServiceRoleClient().storage.from(COVER_BUCKET).remove([path]);
  if (error) {
    console.error("[word-covers] removing a cover file failed", { path, message: error.message });
  }
}

async function readCurrent(
  groupId: string,
): Promise<{ ok: true; coverUrl: string | null } | CoverResult> {
  const { data, error } = await createServiceRoleClient()
    .from("word_groups")
    .select("id, cover_url")
    .eq("id", groupId)
    .maybeSingle();
  if (error) {
    if (error.code === MISSING_COLUMN) return NEEDS_MIGRATION;
    console.error("[word-covers] reading the list failed", error);
    return { ok: false, status: 500, error: "Couldn't read the word list. Please try again." };
  }
  if (!data) return NOT_FOUND;
  return { ok: true, coverUrl: data.cover_url ?? null };
}

/** Makes the cover from an upload, stores it and points the list at it; the list's previous picture is deleted afterwards. */
export async function setWordGroupCover(groupId: string, bytes: Buffer): Promise<CoverResult> {
  const current = await readCurrent(groupId);
  if (!current.ok) return current;

  let image: Buffer;
  try {
    image = await makeCoverImage(bytes);
  } catch (error) {
    if (error instanceof CoverImageError) return { ok: false, status: 422, error: error.message };
    console.error("[word-covers] processing a cover failed", error);
    return { ok: false, status: 500, error: "Couldn't process the picture. Please try again." };
  }

  const supabase = createServiceRoleClient();
  const storage = supabase.storage.from(COVER_BUCKET);
  const path = coverPath(groupId, randomUUID());
  const { error: uploadError } = await storage.upload(path, image, {
    contentType: "image/webp",
    upsert: false,
    cacheControl: "31536000",
  });
  if (uploadError) {
    console.error("[word-covers] uploading a cover failed", uploadError.message);
    return { ok: false, status: 500, error: "Couldn't upload the picture. Please try again." };
  }

  const coverUrl = storage.getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await supabase
    .from("word_groups")
    .update({ cover_url: coverUrl })
    .eq("id", groupId);
  if (updateError) {
    console.error("[word-covers] saving a cover failed", updateError);
    await storage.remove([path]);
    return {
      ok: false,
      status: 500,
      error: "The picture was uploaded but couldn't be saved to the list. Please try again.",
    };
  }

  await removeCoverFile(current.coverUrl);
  void logAdminAction("word_group.cover_changed", "word_group", groupId, {});
  refresh();
  return { ok: true, coverUrl };
}

/** Takes the chosen picture off a list (it shows its drawing again) and deletes the file. */
export async function clearWordGroupCover(groupId: string): Promise<CoverResult> {
  const current = await readCurrent(groupId);
  if (!current.ok) return current;

  const { error } = await createServiceRoleClient()
    .from("word_groups")
    .update({ cover_url: null })
    .eq("id", groupId);
  if (error) {
    console.error("[word-covers] clearing a cover failed", error);
    return { ok: false, status: 500, error: "Couldn't remove the picture. Please try again." };
  }

  await removeCoverFile(current.coverUrl);
  void logAdminAction("word_group.cover_removed", "word_group", groupId, {});
  refresh();
  return { ok: true, coverUrl: null };
}
