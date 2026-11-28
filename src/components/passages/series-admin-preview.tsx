"use client";

import { useState } from "react";

import { SeriesGuessStage, SeriesReveal } from "@/components/passages/series-stage";
import type { SeriesPreview } from "@/components/passages/series-stage-props";
import { useLocale } from "@/components/providers/locale-provider";
import { guessKey, readGuess } from "@/lib/passages/series-guess";

/**
 * The admin's quick try of «What happens next?», on the series shelf: the question or the reveal of
 * any episode without finishing one. What is written here is kept under a key of its own, so the
 * admin's real guess and the real episodes are not touched. The bell is the real one.
 */
export function SeriesAdminPreview({
  userId,
  previews,
}: {
  userId: string;
  previews: SeriesPreview[];
}) {
  const { locale } = useLocale();
  const arabic = locale === "ar";
  const [open, setOpen] = useState<{ index: number; kind: "ask" | "reveal" } | null>(null);
  const tried = `preview:${userId}`;
  const shown = open ? previews[open.index] : undefined;
  const close = () => setOpen(null);

  const ask = (index: number) => {
    // Each try starts from the question again.
    try {
      window.localStorage.removeItem(guessKey(tried, previews[index]!.ask.guess.after));
    } catch {
      // No storage: the stage starts at the question anyway.
    }
    setOpen({ index, kind: "ask" });
  };

  const button =
    "border-border hover:border-primary/50 hover:text-primary rounded-full border px-3 py-1 text-sm font-medium";
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="text-muted-foreground text-sm" dir="auto">
        {arabic ? "للأدمن · تجربة سريعة (الجرس حقيقي)" : "Admin · quick try (the bell is real)"}
      </span>
      {previews.map((preview, index) => (
        <span key={preview.ask.guess.after} className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {arabic ? `الحلقة ${preview.ask.place.number}` : `Episode ${preview.ask.place.number}`}
          </span>
          <button type="button" className={button} onClick={() => ask(index)}>
            {arabic ? "السؤال" : "Question"}
          </button>
          <button
            type="button"
            className={button}
            onClick={() => setOpen({ index, kind: "reveal" })}
          >
            {arabic ? "الكشف" : "Reveal"}
          </button>
        </span>
      ))}

      {shown && open?.kind === "ask" && (
        <SeriesGuessStage
          userId={tried}
          {...shown.ask}
          closeLabel={arabic ? "أغلق" : "Close"}
          onClose={close}
          onOpenNext={close}
        />
      )}
      {shown && open?.kind === "reveal" && (
        <SeriesReveal
          guess={shown.ask.guess}
          place={shown.place}
          // What was written in the last try, else the right answer.
          written={readGuess(tried, shown.ask.guess.after)?.word ?? shown.ask.guess.answer}
          sealedAt={new Date(Date.now() - 86_400_000).toISOString()}
          line={shown.line}
          lineSupport={shown.lineSupport}
          onClose={close}
        />
      )}
    </div>
  );
}
