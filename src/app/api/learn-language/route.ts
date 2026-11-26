import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isGermanOpen } from "@/lib/learn-language-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  isTargetLanguage,
  LEARN_LANGUAGE_ASKED_COOKIE,
  LEARN_LANGUAGE_COOKIE,
  LEARN_LANGUAGE_MAX_AGE_SECONDS,
} from "@/lib/learn-language";

/**
 * A visitor picks the language to learn on this browser (permission germanTrack, open to the visitor).
 * Anyone it is not open to gets a 403 and nothing is stored. English clears the cookie, so the default stays the absence of a choice.
 */
export const dynamic = "force-dynamic";

/** Whether German is open to this visitor (the first-run step asks before it shows itself). */
export async function GET() {
  return NextResponse.json(
    { open: await isGermanOpen() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!(await isGermanOpen())) return NextResponse.json({ ok: false }, { status: 403 });
  const body = (await request.json().catch(() => null)) as {
    language?: string;
    asked?: boolean;
  } | null;
  if (!body || !isTargetLanguage(body.language)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const store = await cookies();
  // The first-time picker (see LearnLanguagePicker) marks itself as shown, whatever the choice was.
  if (body.asked) {
    store.set(LEARN_LANGUAGE_ASKED_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: LEARN_LANGUAGE_MAX_AGE_SECONDS,
    });
  }
  store.set(LEARN_LANGUAGE_COOKIE, body.language, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: LEARN_LANGUAGE_MAX_AGE_SECONDS,
  });
  // Keep the choice on the account too, so another device starts in it. A failed write only means
  // that: the cookie above is what this browser follows.
  try {
    const user = await getCurrentUser();
    if (user) {
      await createServiceRoleClient()
        .from("profiles")
        .update({ target_language: body.language })
        .eq("id", user.id);
    }
  } catch {}
  return NextResponse.json({ ok: true });
}
