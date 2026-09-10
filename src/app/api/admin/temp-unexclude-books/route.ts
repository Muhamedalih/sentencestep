import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * TEMPORARY, one-time-use route — not linked from any UI, deleted right
 * after use. Fourth re-add of this same pattern (see prior commits): these
 * two books keep hitting a fresh Voice Director validation failure on a
 * later chunk after real progress on earlier ones, re-arming the
 * one-strike circuit breaker each time, and being the two oldest-updated
 * books they occupy the front of the candidate queue and block progress on
 * everything behind them while excluded.
 */
const BOOK_IDS = ["book-atomic-habits", "book-7-habits-highly-effective-people"];

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
