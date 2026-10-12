import { BookOpenText, Keyboard, ListChecks, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { planCopy } from "@/lib/home-plan/copy";
import { cefrForLevel, summarizeLevel } from "@/lib/home-plan/plan";
import type { Track, TrackCount } from "@/lib/home-plan/plan";
import type { SupportLocale } from "@/lib/i18n/locales";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";

function Ring({ ratio, Icon }: { ratio: number; Icon: LucideIcon }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="text-primary relative grid size-[52px] place-items-center md:size-14">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={radius} fill="none" strokeWidth="5" className="stroke-border" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={`${circumference * Math.min(1, ratio)} ${circumference}`}
        />
      </svg>
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
  );
}

/**
 * The Profile's level card (admin preview): the learner's current level, how far each of the
 * three tracks — words, stories, lessons — is inside it, the three levels as one bar, and a line
 * about the track furthest behind. Same Card, tile and Badge look as the profile card above it.
 */
export function LevelProgressCard({
  locale,
  level,
  counts,
}: {
  locale: SupportLocale | null;
  level: number;
  counts: Record<Track, TrackCount>;
}) {
  const c = planCopy(locale);
  const summary = summarizeLevel(counts);
  const difficulty = difficultyForLevel(level);
  const tierName = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;
  const trackName: Record<Track, string> = {
    words: c.weakWords,
    stories: c.weakStories,
    lessons: c.weakLessons,
  };
  const trackTip: Record<Track, string> = {
    words: c.tipWords,
    stories: c.tipStories,
    lessons: c.tipLessons,
  };
  const hint =
    summary.percent === 0 || !summary.weakest
      ? c.hintStart
      : `${c.hintWeak
          .replace("{track}", trackName[summary.weakest])
          .replace("{done}", String(counts[summary.weakest].done))
          .replace("{total}", String(counts[summary.weakest].total))} ${trackTip[summary.weakest]}`;
  const tracks: { track: Track; Icon: LucideIcon; label: string }[] = [
    { track: "words", Icon: ListChecks, label: c.ringWords },
    { track: "stories", Icon: BookOpenText, label: c.ringStory },
    { track: "lessons", Icon: Keyboard, label: c.ringWrite },
  ];

  return (
    <Card className="md:py-8">
      <CardHeader className="md:px-8">
        <CardTitle className="text-lg md:text-[1.35rem]">{c.levelLabel}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 md:gap-6 md:px-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight md:text-xl">{tierName}</span>
            <Badge variant="muted" className="md:px-3 md:py-1 md:text-sm">
              <span dir="ltr">{cefrForLevel(level)}</span>
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm md:text-base">
            {c.levelPercent.replace("{n}", String(summary.percent))}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {tracks.map(({ track, Icon, label }) => (
            <div
              key={track}
              className="bg-muted flex flex-col items-center gap-1.5 rounded-lg py-3 text-center md:py-4"
            >
              <Ring
                ratio={counts[track].total > 0 ? counts[track].done / counts[track].total : 0}
                Icon={Icon}
              />
              <span
                className="text-xl leading-none font-extrabold tabular-nums md:text-2xl"
                dir="ltr"
              >
                {counts[track].done}
                <span className="text-muted-foreground text-sm font-semibold">
                  {" "}
                  / {counts[track].total}
                </span>
              </span>
              <span className="text-muted-foreground text-xs font-semibold">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((zone) => (
            <div
              key={zone}
              className={
                zone === level
                  ? "text-primary text-xs font-bold"
                  : "text-muted-foreground text-xs font-bold"
              }
            >
              <span className="bg-muted border-border mb-1 block h-2 overflow-hidden rounded-full border">
                <i
                  className="bg-primary block h-full"
                  style={{
                    width: `${zone < level ? 100 : zone === level ? summary.percent : 0}%`,
                  }}
                />
              </span>
              <span dir="ltr">{cefrForLevel(zone)}</span>
            </div>
          ))}
        </div>

        <p className="bg-muted text-muted-foreground flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm md:text-base">
          <Sparkles className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {hint}
        </p>
      </CardContent>
    </Card>
  );
}
