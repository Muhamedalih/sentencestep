import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAllLessons } from "@/lib/content";
import { filterFree } from "@/lib/content-helpers";
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import { LEARNING_MODES } from "@/lib/learning-modes";
import { MODE_TITLE_KEY } from "@/components/marketing/mode-title-key";

export async function FreeExperience({ t }: { t: Dictionary }) {
  const lessonsByMode = await getAllLessons();

  return (
    <section id="free" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.marketing.freeHeading}
        </h2>
        <p className="text-muted-foreground mt-3 text-lg text-balance">
          {t.marketing.freeSubtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {LEARNING_MODES.map((mode) => {
          const title = t.nav[MODE_TITLE_KEY[mode]];
          const freeCount = filterFree(lessonsByMode[mode]).length;
          return (
            <Card key={mode} className="gap-0 rounded-2xl p-6 text-center">
              <p className="text-primary text-3xl font-semibold tracking-tight">{freeCount}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t.marketing.freeModeCount.replace("{mode}", title.toLowerCase())}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" asChild>
          <Link href="/learn">{t.marketing.startLearningFree}</Link>
        </Button>
      </div>
    </section>
  );
}
