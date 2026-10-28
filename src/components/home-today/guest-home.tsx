"use client";

import Link from "next/link";
import { Eye, Headphones, PenLine, TrendingUp } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { LessonUnit } from "@/types/content";

/**
 * The phone home of a visitor who has no account yet (permission mobilePath): the brand line, one
 * button to the first lesson, the way lessons work, a quiet line to sign up, and the other two kinds
 * of content. It replaces the sign-up card and the two cards that stood first before any lesson.
 * Below md: only.
 */
export function MobileGuestHome({
  firstLesson,
  minutes,
  passagesEnabled,
}: {
  firstLesson: LessonUnit | null;
  minutes: number;
  passagesEnabled: boolean;
}) {
  const { t } = useLocale();
  const steps = [
    { icon: Eye, label: t.mobilePath.watch },
    { icon: Headphones, label: t.mobilePath.listen },
    { icon: PenLine, label: t.mobilePath.write },
    { icon: TrendingUp, label: t.mobilePath.progress },
  ];
  const linkClass =
    "border-border bg-card hover:bg-muted/50 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors";

  return (
    <div className="mx-auto max-w-xl px-5 pt-5 pb-28 md:hidden">
      <p className="text-2xl leading-snug font-bold tracking-tight" dir="auto">
        {t.mobilePath.headline}
      </p>

      {firstLesson && (
        <div className="border-primary/40 bg-brand-muted/40 mt-6 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium" dir="auto">
            {t.mobilePath.startHere}
          </p>
          <p className="mt-1 text-lg font-semibold" dir="ltr">
            {firstLesson.title}
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm" dir="auto">
            {t.mobilePath.lessonLength.replace("{minutes}", String(minutes))}
          </p>
          <Link
            href={`/learn/normal/${firstLesson.id}`}
            className="bg-primary text-primary-foreground mt-3 flex h-11 w-full items-center justify-center rounded-[10px] text-sm font-semibold"
          >
            <span dir="auto">{t.mobilePath.startNow}</span>
          </Link>
        </div>
      )}

      <ol className="text-muted-foreground mt-5 flex items-center justify-between gap-1 text-xs font-medium">
        {steps.map(({ icon: Icon, label }, index) => (
          <li key={label} className="flex items-center gap-1">
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span dir="auto">{label}</span>
            {index < steps.length - 1 && (
              <span aria-hidden="true" className="px-0.5">
                ›
              </span>
            )}
          </li>
        ))}
      </ol>

      <Link
        href="/login"
        className="text-muted-foreground mt-4 block text-center text-sm underline"
      >
        <span dir="auto">{t.mobilePath.signUpKeep}</span>
      </Link>

      <p className="mt-7 text-sm font-semibold" dir="auto">
        {t.mobilePath.explore}
      </p>
      <div className="mt-2.5 flex flex-col gap-2.5">
        {passagesEnabled && (
          <Link href="/learn/passages" className={linkClass}>
            <span dir="auto">{t.nav.passages}</span>
            <span aria-hidden="true">›</span>
          </Link>
        )}
        <Link href="/learn/stories" className={linkClass}>
          <span dir="auto">{t.nav.stories}</span>
          <span aria-hidden="true">›</span>
        </Link>
      </div>
    </div>
  );
}
