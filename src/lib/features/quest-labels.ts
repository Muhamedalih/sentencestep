import type { QuestType } from "@/lib/features/catalog";
import type { Dictionary } from "@/lib/i18n/dictionary/types";

/** The localized title of a quest type. A switch, not a computed key, so adding a QuestType fails to compile here until its string exists. */
export function questTitle(t: Dictionary, type: QuestType): string {
  switch (type) {
    case "sentences":
      return t.quests.typeSentences;
    case "lessons":
      return t.quests.typeLessons;
    case "accuracy":
      return t.quests.typeAccuracy;
    case "masterWords":
      return t.quests.typeMasterWords;
    case "dictation":
      return t.quests.typeDictation;
    case "dailySession":
      return t.quests.typeDailySession;
  }
}
