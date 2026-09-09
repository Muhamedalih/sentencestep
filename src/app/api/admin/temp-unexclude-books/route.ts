import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * TEMPORARY, one-time-use route — not linked from any UI, deleted right
 * after use. Clears voice_generation_excluded on a hardcoded list of books
 * that were auto-excluded long ago after a past Voice Director validation
 * failure (see book-voice-generation.ts's own doc comment on that
 * mechanism), which silently blocked them from ever being offered to the
 * bulk/cron sweep again — invisible since the admin-facing "Exclude"
 * checkbox was removed 2026-09-10. The user explicitly asked for these
 * exact books' missing audio to be generated; this is the one-time unblock
 * that makes that possible, done as a normal reviewed code change (this
 * file, git-committed) rather than a raw database script, per this
 * project's direct-DB-mutation safety policy.
 */
const BOOK_IDS = [
  "book-atomic-habits",
  "book-the-power-of-now",
  "book-7-habits-highly-effective-people",
  "book-subtle-art-not-giving-a-fuck",
  "book-mindset",
  "book-psychology-of-money",
  "book-deep-work",
  "book-48-laws-of-power",
  "book-rich-dad-poor-dad",
  "book-courage-to-be-disliked",
  "book-essentialism",
  "book-the-power-of-habit",
  "book-cant-hurt-me",
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
