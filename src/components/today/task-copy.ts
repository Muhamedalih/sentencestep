import type { useLocale } from "@/components/providers/locale-provider";
import type { TodayQuestInfo } from "@/lib/features/quests";
import type { SupportLocale } from "@/lib/i18n/locales";
import { sceneStrings, tidyWhy } from "@/lib/today/scene-strings";

type TodayCopy = ReturnType<typeof useLocale>["t"]["today"];

/** The words of one task of the day, whichever shape the day has. */
export interface TaskCopy {
  title: string;
  start: string;
  why: string;
}

/**
 * The detail line of a scene day's second and third tasks ("5 missing lines · about 3 min"), or null
 * for a task whose line is the usual one (its title, level and time).
 */
export function sceneDetail(
  info: Pick<TodayQuestInfo, "kind" | "scene" | "minutes">,
  locale: SupportLocale | null,
): string | null {
  if (!info.scene || (info.kind !== "story" && info.kind !== "words")) return null;
  const strings = sceneStrings(locale);
  return info.kind === "story"
    ? `${strings.linesMeta(info.scene.lines)} · ${strings.about(info.minutes)}`
    : strings.wordsMeta;
}

/** On a scene day: the day's name and its passage's title, for the folded box; else null. */
export function sceneHeading(
  quests: readonly { today?: Pick<TodayQuestInfo, "scene" | "title"> }[],
  locale: SupportLocale | null,
): { name: string; title: string } | null {
  const named = quests.find((quest) => quest.today?.scene && quest.today.title)?.today;
  return named ? { name: sceneStrings(locale).name, title: named.title } : null;
}

/** The reward line while something is left: the scene's on a scene day, else the usual one. */
export function rewardLine(
  copy: TodayCopy,
  quests: readonly { today?: Pick<TodayQuestInfo, "scene"> }[],
  totalXp: number,
  locale: SupportLocale | null,
): string {
  return quests.some((quest) => quest.today?.scene)
    ? sceneStrings(locale).reward(totalXp)
    : copy.rewardAll.replace("{xp}", String(totalXp));
}

/**
 * What a task of Home's box is called, what its button says and why it is worth doing: the scene's own
 * words on a scene day (permission dailyScene), else the usual ones, with the two corrected
 * explanations while the todayTidy permission is open.
 */
export function taskCopy(
  copy: TodayCopy,
  info: Pick<TodayQuestInfo, "kind" | "scene">,
  options: { locale: SupportLocale | null; tidy: boolean },
): TaskCopy {
  const { kind } = info;
  if (info.scene && kind !== "sentences") {
    const scene = sceneStrings(options.locale);
    return {
      listen: { title: scene.taskListen, start: scene.startListen, why: scene.whyListen },
      story: { title: scene.taskLines, start: scene.startLines, why: scene.whyLines },
      words: { title: scene.taskWords, start: scene.startWords, why: scene.whyWords },
    }[kind];
  }
  const tidy = options.tidy ? tidyWhy(options.locale) : null;
  return {
    listen: { title: copy.taskListen, start: copy.startListen, why: copy.whyListen },
    story: { title: copy.taskStory, start: copy.startStory, why: tidy?.story ?? copy.whyStory },
    words: { title: copy.taskWords, start: copy.startWords, why: tidy?.words ?? copy.whyWords },
    sentences: { title: copy.taskSentences, start: copy.startSentences, why: copy.whySentences },
  }[kind];
}
