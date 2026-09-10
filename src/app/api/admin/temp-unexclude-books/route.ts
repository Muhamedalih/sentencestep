import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * TEMPORARY, one-time-use route — not linked from any UI, deleted right
 * after use. See the first version of this file's own commit message for
 * the full background. Re-added because several of these books keep
 * hitting a fresh Voice Director validation failure on a *later* chunk
 * after the previous un-exclude + several chunks' worth of real progress
 * (confirmed: Deep Work reached 25/70 before being auto-excluded again),
 * which re-arms the one-strike circuit breaker each time.
 */
const BOOK_IDS = [
  "book-atomic-habits",
  "book-the-power-of-now",
  "book-7-habits-highly-effective-people",
  "book-subtle-art-not-giving-a-fuck",
  "book-mindset",
  "book-deep-work",
];

export async function GET(): Promise<NextResponse> {
  const forbidden = await requireAdmin();
  if (forbidden) return NextResponse.json({ error: forbidden }, { status: 403 });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("books")
    .update({ voice_generation_excluded: false })
    .in("id", BOOK_IDS)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ updated: data.map((row) => row.id) });
}
