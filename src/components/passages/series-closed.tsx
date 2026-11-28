"use client";

import { useRouter } from "next/navigation";

import { SeriesGuessStage } from "@/components/passages/series-stage";
import type { SeriesAsk } from "@/components/passages/series-stage-props";
import { useLocale } from "@/components/providers/locale-provider";
import { guessStrings } from "@/lib/passages/series-guess-strings";

/** An episode that opens tomorrow: the waiting screen of «What happens next?» in its place. */
export function SeriesClosed({ userId, ...ask }: SeriesAsk & { userId: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  return (
    <SeriesGuessStage
      userId={userId}
      {...ask}
      waitOnly
      closeLabel={guessStrings(locale).backToList}
      onClose={() => router.push("/learn/passages")}
      onOpenNext={() => window.location.reload()}
    />
  );
}
