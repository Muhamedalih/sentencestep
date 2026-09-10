import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * TEMPORARY, one-time-use route — not linked from any UI, deleted right
 * after use. Third re-add of this same pattern (see prior commits for
 * background): a handful of books keep hitting a fresh Voice Director
 * validation failure on a later chunk after real progress on earlier ones,
 * re-arming the one-strike circuit breaker each time. The user asked to
 * stay with this until every book finishes, so this gets re-added and
 * removed each time a book needs clearing rather than left in place
 * permanently.
 */
const BOOK_IDS = [
  "book-atomic-habits",
  "book-mindset",
  "book-7-habits-highly-effective-people",
  "book-the-power-of-now",
  "book-subtle-art-not-giving-a-fuck",
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
