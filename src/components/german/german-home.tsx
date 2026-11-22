import Link from "next/link";

import { getDraftLessonSummaries } from "@/lib/content";
import { getDraftWordGroupSummaries } from "@/lib/word-lists";
import { fetchPassageProgress, fetchGermanPassageSummaries } from "@/lib/passages/queries";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import type { SupportLocale } from "@/lib/i18n/locales";

type Row = { href: string; title: string; subtitle?: string; done: number; total: number };

function pickNext<T extends { id: string }>(items: T[], doneIds: Set<string>): T | undefined {
  return items.find((item) => !doneIds.has(item.id)) ?? items[0];
}

/**
 * Home for a learner of German (permission germanTrack, Admins only for now): the next lesson, story,
 * word list and passage of the German track, each with how many are done. German content is separate
 * from English by id ("de-…"), so the progress it reads is already its own. The classic cards, the
 * Today plan and the streak strip stay English-only for now.
 */
export async function GermanHome({
  userId,
  locale,
}: {
  userId: string | null;
  locale: SupportLocale | null;
}) {
  const arabic = locale === "ar";
  const [lessons, stories, groups, passages, progress, passageProgress] = await Promise.all([
    getDraftLessonSummaries("normal", locale ?? undefined, "de").catch(() => []),
    getDraftLessonSummaries("stories", locale ?? undefined, "de").catch(() => []),
    getDraftWordGroupSummaries(locale ?? undefined, "de"),
    fetchGermanPassageSummaries(),
    userId ? fetchProgressCached(todayLocalISODate()).catch(() => undefined) : undefined,
    userId ? fetchPassageProgress(userId) : Promise.resolve([]),
  ]);
  const doneLessons = new Set((progress?.completions ?? []).map((entry) => entry.lessonId));
  const donePassages = new Set(
    passageProgress.filter((entry) => entry.completedAt).map((entry) => entry.passageId),
  );

  const nextLesson = pickNext(lessons, doneLessons);
  const nextStory = pickNext(stories, doneLessons);
  const nextPassage = pickNext(passages, donePassages);
  const nextGroup = groups[0];

  const rows: { label: string; row: Row | undefined }[] = [
    {
      label: arabic ? "الدرس التالي" : "Next lesson",
      row: nextLesson && {
        href: `/learn/normal/${nextLesson.id}`,
        title: nextLesson.title,
        subtitle: nextLesson.supportTitle ?? nextLesson.titleAr,
        done: lessons.filter((l) => doneLessons.has(l.id)).length,
        total: lessons.length,
      },
    },
    {
      label: arabic ? "القصة التالية" : "Next story",
      row: nextStory && {
        href: `/learn/stories/${nextStory.id}`,
        title: nextStory.title,
        subtitle: nextStory.supportTitle ?? nextStory.titleAr,
        done: stories.filter((l) => doneLessons.has(l.id)).length,
        total: stories.length,
      },
    },
    {
      label: arabic ? "قائمة كلمات" : "Word list",
      row: nextGroup && {
        href: `/learn/word-lists/${nextGroup.id}`,
        title: nextGroup.title,
        subtitle: nextGroup.titleAr,
        done: 0,
        total: groups.length,
      },
    },
    {
      label: arabic ? "قراءة" : "Passage",
      row: nextPassage && {
        href: `/learn/passages/${nextPassage.id}`,
        title: nextPassage.title,
        subtitle: nextPassage.summary,
        done: passages.filter((p) => donePassages.has(p.id)).length,
        total: passages.length,
      },
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <h1 className="text-2xl font-semibold" dir="ltr">
        Heute
      </h1>
      <p className="text-muted-foreground mt-1 text-sm" dir="auto">
        {arabic
          ? "مسار الألمانية: درس وقصة وكلمات وقراءة. غيّر اللغة من الشريحة في الأعلى."
          : "The German track: a lesson, a story, words and a passage. Switch language with the chip above."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.map(({ label, row }) =>
          row ? (
            <Link
              key={label}
              href={row.href}
              className="border-border bg-card hover:bg-muted/40 focus-visible:ring-ring flex flex-col gap-1.5 rounded-2xl border p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span
                className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                dir="auto"
              >
                {label}
              </span>
              <span className="text-lg font-semibold" dir="ltr">
                {row.title}
              </span>
              {row.subtitle && (
                <span className="text-muted-foreground line-clamp-2 text-sm" dir="auto">
                  {row.subtitle}
                </span>
              )}
              <span className="text-muted-foreground mt-2 text-xs tabular-nums" dir="ltr">
                {row.done} / {row.total}
              </span>
            </Link>
          ) : (
            <div
              key={label}
              className="border-border text-muted-foreground rounded-2xl border border-dashed p-5 text-sm"
              dir="auto"
            >
              {label}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
