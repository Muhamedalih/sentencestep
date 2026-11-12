import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin/access";
import { isSameOrigin } from "@/lib/admin/same-origin";
import { clearWordGroupCover, setWordGroupCover } from "@/lib/admin/word-group-covers";
import { GROUP_ID_PATTERN, MAX_COVER_BYTES, MAX_COVER_LABEL, isCoverType } from "@/lib/word-covers";

/**
 * The cover picture of one Word List (the Word Lists page, for an admin).
 *
 *  - POST    multipart form, field "file": makes the cover from it and points the list at it
 *            (the previous picture is deleted).
 *  - DELETE  takes the picture off: the list shows the drawing made for its topic again.
 *
 * A route handler rather than a Server Action because a picture is bigger than a Server Action
 * may carry (1 MB) and raising that limit would raise it for every action on the site. It checks
 * what Next.js would otherwise check for it: the request must come from this site's own pages,
 * and from an admin.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The framing of the form around the file itself. */
const FORM_OVERHEAD_BYTES = 64 * 1024;

const respond = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

type Context = { params: Promise<{ groupId: string }> };

/** Null when the caller may go on, else the answer to send. */
async function refuse(request: Request): Promise<NextResponse | null> {
  if (!isSameOrigin(request)) {
    return respond({ error: "That request didn't come from this site." }, 403);
  }
  if (!(await isAdmin())) return respond({ error: "You don't have permission to do that." }, 403);
  return null;
}

export async function POST(request: Request, { params }: Context) {
  try {
    const refused = await refuse(request);
    if (refused) return refused;

    const { groupId } = await params;
    if (!GROUP_ID_PATTERN.test(groupId)) {
      return respond({ error: "That word list doesn't exist." }, 404);
    }

    const tooBig = { error: `That picture is too big. Use one under ${MAX_COVER_LABEL}.` };
    // Turned away before the body is read when it says it is too big.
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_COVER_BYTES + FORM_OVERHEAD_BYTES) {
      return respond(tooBig, 413);
    }

    let file: FormDataEntryValue | null;
    try {
      file = (await request.formData()).get("file");
    } catch {
      return respond({ error: "Couldn't read the upload. Please try again." }, 400);
    }
    if (!(file instanceof File) || file.size === 0) {
      return respond({ error: "Choose a picture first." }, 400);
    }
    if (file.size > MAX_COVER_BYTES) return respond(tooBig, 413);
    if (!isCoverType(file.type)) {
      return respond({ error: "Use a JPG, PNG, WebP or AVIF picture." }, 415);
    }

    const result = await setWordGroupCover(groupId, Buffer.from(await file.arrayBuffer()));
    return result.ok
      ? respond({ coverUrl: result.coverUrl })
      : respond({ error: result.error }, result.status);
  } catch (error) {
    console.error("[word-covers] cover upload failed", error);
    return respond({ error: "Couldn't save the picture. Please try again." }, 500);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const refused = await refuse(request);
    if (refused) return refused;

    const { groupId } = await params;
    if (!GROUP_ID_PATTERN.test(groupId)) {
      return respond({ error: "That word list doesn't exist." }, 404);
    }

    const result = await clearWordGroupCover(groupId);
    return result.ok
      ? respond({ coverUrl: null })
      : respond({ error: result.error }, result.status);
  } catch (error) {
    console.error("[word-covers] cover removal failed", error);
    return respond({ error: "Couldn't remove the picture. Please try again." }, 500);
  }
}
