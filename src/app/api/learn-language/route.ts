import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin/access";
import {
  isTargetLanguage,
  LEARN_LANGUAGE_COOKIE,
  LEARN_LANGUAGE_MAX_AGE_SECONDS,
} from "@/lib/learn-language";

/**
 * An admin picks the language to learn on this browser (permission germanTrack). Anyone else gets a
 * 403 and nothing is stored. English clears the cookie, so the default stays the absence of a choice.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { language?: string } | null;
  if (!body || !isTargetLanguage(body.language)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const store = await cookies();
  if (body.language === "en") {
    store.delete(LEARN_LANGUAGE_COOKIE);
  } else {
    store.set(LEARN_LANGUAGE_COOKIE, body.language, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: LEARN_LANGUAGE_MAX_AGE_SECONDS,
    });
  }
  return NextResponse.json({ ok: true });
}
