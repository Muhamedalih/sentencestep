import { NextResponse } from "next/server";

import { buildAnkiTsv } from "@/lib/cards/anki";
import { fetchSavedCards } from "@/lib/cards/queries";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { createClient } from "@/lib/supabase/server";

// Per-learner data: never cached.
export const dynamic = "force-dynamic";

/**
 * Downloads the signed-in learner's saved word cards as an Anki-importable
 * tab-separated file. 404 (not 401/403) when the feature isn't open to them,
 * so its existence isn't advertised while it's switched off.
 */
export async function GET() {
  const features = await getEffectiveFeatures();
  if (!features.personalCards.page) return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return new NextResponse("Not found", { status: 404 });

  try {
    const cards = await fetchSavedCards(userId);
    const body = buildAnkiTsv(
      cards.map((card) => ({
        word: card.word,
        meaning: card.meaning,
        sentenceEn: card.sentenceEn,
        wordIndex: card.wordIndex,
        lessonTitle: card.lessonTitle,
        mode: card.mode,
      })),
    );
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sentencestep-cards.txt"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[cards] export failed", error);
    return new NextResponse("Couldn't export your cards right now.", { status: 500 });
  }
}
