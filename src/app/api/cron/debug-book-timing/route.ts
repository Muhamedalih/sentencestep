import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { fetchBookSections, fetchSectionAfter } from "@/lib/supabase/queries/book-content";

/**
 * TEMPORARY diagnostic route (2026-09-12) — measures, from Netlify's own
 * function environment (not a local machine), where the section-transition
 * round trip's remaining latency actually goes, now that the request-storm
 * fix (pronunciation-settings-provider.tsx) is deployed. To be deleted once
 * that's answered — not a permanent addition to the cron surface.
 */
async function handleDebugTiming(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }
  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bookId = new URL(request.url).searchParams.get("bookId") ?? "book-atomic-habits";

  const t0 = Date.now();
  const sections = await fetchBookSections(bookId);
  const t1 = Date.now();

  const firstSection = sections[0];
  if (!firstSection) {
    return NextResponse.json({ error: "No sections found for this book." }, { status: 404 });
  }

  const next = await fetchSectionAfter(bookId, firstSection.orderIndex, "ar");
  const t2 = Date.now();

  return NextResponse.json({
    bookId,
    sectionCount: sections.length,
    nextSectionId: next?.id ?? null,
    nextSectionSentenceCount: next?.sentences.length ?? 0,
    timingMs: {
      fetchBookSections: t1 - t0,
      fetchSectionAfter: t2 - t1,
      total: t2 - t0,
    },
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleDebugTiming(request);
}
