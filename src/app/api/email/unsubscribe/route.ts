import { NextResponse } from "next/server";

import { applyUnsubscribe } from "@/lib/email/unsubscribe";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * The address behind the "List-Unsubscribe" header of nudge emails. Mail apps (Gmail, Apple Mail)
 * show their own Unsubscribe button and POST here (RFC 8058), so it must answer 200 with no
 * redirect. A browser that opens it is sent to the unsubscribe page instead.
 */
function params(request: Request) {
  const search = new URL(request.url).searchParams;
  return { userId: search.get("u"), token: search.get("t") };
}

export async function POST(request: Request): Promise<NextResponse> {
  const { userId, token } = params(request);
  if (!userId || !verifyUnsubscribeToken(userId, token, process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  }
  try {
    await applyUnsubscribe(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[unsubscribe] failed", error);
    return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const search = new URL(request.url).search;
  return NextResponse.redirect(new URL(`/unsubscribe${search}`, getRequestOrigin(request)), 303);
}
