import type { PassageExamSeed } from "@/data/passages/exams/helpers";
import esTable from "@/data/passages/i18n/es.json";
import trTable from "@/data/passages/i18n/tr.json";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { Passage, PassageSummary } from "@/lib/passages/types";

/**
 * Spanish and Turkish for the text a passage shows beside its English: the title and one-line hook,
 * every part's title, every line, every question and answer, the meaning of each key word and the
 * questions of the full exam.
 *
 * The passages themselves (the database and src/data/passages) keep their Arabic in the `ar` fields.
 * The files `src/data/passages/i18n/<locale>.json` hold, per passage id, ONE flat list of texts in the
 * order {@link passageTexts} walks the passage in, so a passage and its translation can never drift
 * apart without a test (passages.test.ts) saying so. The pages swap them in on the server, so a
 * learner whose support language is Spanish or Turkish gets a passage whose `ar` fields hold their
 * own language and the screens that show them need no change. Arabic (and a visitor who has not chosen
 * a language yet) gets the passage as written.
 *
 * A passage whose list does not fit (an admin added a line, a part or a question) is NOT half
 * translated: `available` is false and the reader shows no translations for it at all.
 */

const TABLES: Record<"es" | "tr", Record<string, string[]>> = { es: esTable, tr: trTable };

/** "True" and "False" in the learner's language; the exam's two true/false options are not in the lists. */
const TRUE_FALSE: Record<"es" | "tr", readonly [string, string]> = {
  es: ["Verdadero", "Falso"],
  tr: ["Doğru", "Yanlış"],
};

function isTrueFalse(options: readonly { en: string }[]): boolean {
  return options.length === 2 && options[0]?.en === "True" && options[1]?.en === "False";
}

/**
 * The shape the flat list has for a passage, as a count: the title and the hook, then per part its
 * title, its lines, and per question the question and its answers; then one meaning per key word;
 * then, per exam question, the question and its answers (a true/false question has none of its own).
 */
export function expectedTextCount(passage: Passage, exam: PassageExamSeed | undefined): number {
  let count = 2;
  for (const section of passage.sections) {
    count += 1 + section.sentences.length;
    for (const question of section.questions) count += 1 + question.options.length;
  }
  count += passage.words.length;
  for (const item of exam ?? []) count += 1 + (isTrueFalse(item.options) ? 0 : item.options.length);
  return count;
}

/** True when this locale has a translation list for this passage id that fits the passage. */
export function hasPassageTexts(
  passage: Passage,
  exam: PassageExamSeed | undefined,
  locale: SupportLocale | null,
): boolean {
  if (locale !== "es" && locale !== "tr") return false;
  const rows = TABLES[locale][passage.id];
  return Boolean(rows) && rows!.length === expectedTextCount(passage, exam);
}

export interface LocalizedPassage {
  passage: Passage;
  exam: PassageExamSeed | undefined;
  /** The reader may show translations for this learner (Arabic, or Spanish/Turkish with a fitting list). */
  available: boolean;
}

export function localizePassage(
  passage: Passage,
  exam: PassageExamSeed | undefined,
  locale: SupportLocale | null,
): LocalizedPassage {
  if (locale === "ar") return { passage, exam, available: true };
  if (locale !== "es" && locale !== "tr") return { passage, exam, available: false };
  if (!hasPassageTexts(passage, exam, locale)) return { passage, exam, available: false };

  const rows = TABLES[locale][passage.id]!;
  let position = 0;
  const next = (): string => rows[position++]!;

  const titleAr = next();
  const summaryAr = next();
  const sections = passage.sections.map((section) => {
    const sectionTitle = next();
    const sentences = section.sentences.map((sentence) => ({ ...sentence, ar: next() }));
    const questions = section.questions.map((question) => {
      const promptAr = next();
      return {
        ...question,
        promptAr,
        options: question.options.map((option) => ({ ...option, ar: next() })),
      };
    });
    return { ...section, titleAr: sectionTitle, sentences, questions };
  });

  const lineByEnglish = new Map<string, string>();
  for (const section of sections) {
    for (const sentence of section.sentences) {
      if (!lineByEnglish.has(sentence.en)) lineByEnglish.set(sentence.en, sentence.ar);
    }
  }
  const words = passage.words.map((word) => ({
    ...word,
    hintAr: next(),
    contextAr: word.contextEn ? (lineByEnglish.get(word.contextEn) ?? null) : null,
  }));

  const [trueText, falseText] = TRUE_FALSE[locale];
  const localizedExam = exam?.map((item) => {
    if (isTrueFalse(item.options)) {
      return {
        ...item,
        ar: next(),
        options: [
          { en: item.options[0]!.en, ar: trueText },
          { en: item.options[1]!.en, ar: falseText },
        ],
      };
    }
    const ar = next();
    return { ...item, ar, options: item.options.map((option) => ({ en: option.en, ar: next() })) };
  });

  return {
    passage: { ...passage, titleAr, summaryAr, sections, words },
    exam: localizedExam,
    available: true,
  };
}

/**
 * A card's title and hook in the learner's language. For Spanish and Turkish a passage with no list
 * gets EMPTY texts (a card shows its translation line only when there is one), never the Arabic.
 */
export function localizeSummary<T extends Pick<PassageSummary, "id" | "titleAr" | "summaryAr">>(
  summary: T,
  locale: SupportLocale | null,
): T {
  if (locale !== "es" && locale !== "tr") return summary;
  const rows = TABLES[locale][summary.id];
  return { ...summary, titleAr: rows?.[0] ?? "", summaryAr: rows?.[1] ?? "" };
}
