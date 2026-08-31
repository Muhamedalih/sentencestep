import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUIRED_SENTENCE_COUNT } from "@/lib/admin/validation";
import { filterFree, getAllLessons } from "@/lib/content";
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import { LEARNING_MODES, modeMeta } from "@/lib/learning-modes";
import { MODE_TITLE_KEY, MODE_DESCRIPTION_KEY } from "@/components/marketing/mode-title-key";

export async function ModeSection({ t }: { t: Dictionary }) {
  const lessonsByMode = await getAllLessons();

  return (
    <section id="modes" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.marketing.modesHeading}
        </h2>
        <p className="text-muted-foreground mt-3 text-lg text-balance">
          {t.marketing.modesSubtitle}
        </p>
      </div>

      {/* Conversation is deliberately excluded here — off the current
          roadmap for now (see learn-sidebar.tsx's identical exclusion from
          primary nav), not a removed mode: its content/route are untouched,
          this just stops the marketing page from advertising it. Remove
          the filter to bring it back; grid-cols would need lg:grid-cols-3
          again too. */}
      <div className="grid gap-6 sm:grid-cols-2">
        {LEARNING_MODES.filter((mode) => mode !== "conversation").map((mode, index) => {
          const copy = modeMeta[mode];
          const Icon = copy.icon;
          const title = t.nav[MODE_TITLE_KEY[mode]];
          const description = t.marketing[MODE_DESCRIPTION_KEY[mode]];
          const units = lessonsByMode[mode];
          const totalLessons = units.length;
          const freeLessons = filterFree(units).length;
          // Not unit.sentences.length summed — premium lessons' sentences
          // are RLS-hidden from the anon client this marketing page reads
          // through, which would undercount the library (e.g. showing "8
          // lessons · 72 sentences" instead of the true ~96). Normal
          // lessons and conversations have exactly REQUIRED_SENTENCE_COUNT[mode]
          // sentences by construction (enforced by the admin CMS), so this
          // total is exact for those two modes. Stories are the one
          // exception — they're intentionally NOT held to a fixed length
          // (see the Stories content-quality audit) — so for "stories" this
          // is a reasonable approximation using the library's typical
          // length, not an exact count.
          const sentences = totalLessons * REQUIRED_SENTENCE_COUNT[mode];

          return (
            <Card
              key={mode}
              className="animate-rise-in transition-shadow duration-300 [animation-fill-mode:backwards] hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="bg-brand-muted text-primary mb-2 flex size-11 items-center justify-center rounded-lg">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <span>
                    {t.marketing.lessonsAndSentences
                      .replace("{lessons}", String(totalLessons))
                      .replace("{sentences}", String(sentences))}
                  </span>
                  <span className="text-success font-medium">
                    {t.progress.freeCount.replace("{n}", String(freeLessons))}
                  </span>
                </div>
                <Link
                  href={`/learn/${mode}`}
                  className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  {t.marketing.exploreMode.replace("{mode}", title.toLowerCase())}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
