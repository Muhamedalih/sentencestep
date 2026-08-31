import Anthropic from "@anthropic-ai/sdk";

import { LOCALE_META } from "@/lib/i18n/locales";
import type {
  GlossaryTerm,
  LessonTranslationInput,
  TranslationProvider,
} from "@/lib/translation/provider";

/**
 * The only file in this codebase that imports @anthropic-ai/sdk — every
 * other layer (generate.ts, the admin action, any future review/cron code)
 * goes through the TranslationProvider interface (provider.ts) instead,
 * exactly like email/provider.ts keeps the rest of the app off a specific
 * email vendor's SDK. Swapping providers later means writing a new file
 * like this one, not touching generate.ts.
 */

export const DEFAULT_TRANSLATION_MODEL = "claude-sonnet-5";

const TOOL_NAME = "submit_lesson_translation";

const TRANSLATION_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description:
    "Submit the translated lesson content. Call this exactly once with the complete translation.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: ["string", "null"] },
      sentences: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            text: { type: "string" },
            words: {
              type: "array",
              description:
                "One entry per requested vocabulary word/phrase for this sentence, same order — empty array if none were requested.",
              items: {
                type: "object",
                properties: {
                  en: {
                    type: "string",
                    description: "Echoes the requested English word/phrase exactly.",
                  },
                  text: { type: "string" },
                },
                required: ["en", "text"],
                additionalProperties: false,
              },
            },
          },
          required: ["id", "text", "words"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "description", "sentences"],
    additionalProperties: false,
  },
};

function formatGlossary(glossary: GlossaryTerm[]): string {
  if (glossary.length === 0) return "(none)";
  return glossary
    .map((term) => {
      const rule =
        term.rule === "preserve"
          ? "never translate or transliterate — keep exactly as written"
          : "may be transliterated, but must be rendered the same way every time it appears";
      return `- "${term.term}": ${rule}${term.note ? ` (${term.note})` : ""}`;
    })
    .join("\n");
}

function buildSystemPrompt(): string {
  return [
    "You translate short English-learning lesson content for SentenceStep, an app that teaches English to speakers of other languages.",
    "The sentences you translate are the LEARNER-SUPPORT text shown alongside the English original — not a replacement for it. They must:",
    "- preserve the exact meaning of the English source",
    "- read as natural, simple phrasing in the target language, matching the simplicity level of the English",
    "- preserve proper names as proper names (do not translate personal names; only transliterate a name if the target language conventionally would)",
    "- preserve the given sentence order exactly",
    "- never add explanations, commentary, markdown formatting, quotation marks around the whole text, or any text beyond the translation itself",
    "Some sentences also list specific vocabulary words/phrases (each one a literal substring of that sentence's English text) that need their own word-level translation, shown to the learner as a highlight while they type that exact word. For each one:",
    "- translate ONLY that word/phrase, as it is used in this specific sentence's context — not a generic dictionary translation",
    "- return the single most natural word or short phrase a learner would need, not a full clause",
    "- echo the requested English word/phrase back exactly in the `en` field, unchanged",
    "- a sentence with no listed vocabulary words gets an empty `words` array — never invent extra ones",
    "Respect the glossary exactly as given — its rules override any general judgment about names or terminology.",
    "Call the submit_lesson_translation tool exactly once with the complete result. Do not ask questions or produce any other output.",
  ].join("\n");
}

function buildUserPrompt(input: LessonTranslationInput): string {
  const localeMeta = LOCALE_META[input.targetLocale];
  const lines = [
    `Target language: ${localeMeta.label} (${localeMeta.nativeLabel}), locale code "${input.targetLocale}".`,
    input.levelLabel ? `Lesson level: ${input.levelLabel}.` : null,
    "",
    "Glossary (apply exactly):",
    formatGlossary(input.glossary),
    "",
    `Title: ${input.title}`,
    input.description !== null
      ? `Description: ${input.description}`
      : "Description: (none — this lesson has no description; return description as null.)",
    "",
    "Sentences, in order:",
    ...input.sentences.flatMap((s, i) => [
      `${i + 1}. [id: ${s.id}] ${s.en}`,
      s.words.length > 0
        ? `   Vocabulary words to translate for this sentence: ${s.words.map((w) => `"${w}"`).join(", ")}`
        : "   Vocabulary words to translate for this sentence: (none)",
    ]),
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

export function createAnthropicTranslationProvider(
  apiKey: string,
  model: string,
): TranslationProvider {
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",
    async translateLesson(input: LessonTranslationInput): Promise<unknown> {
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: buildUserPrompt(input) }],
        tools: [TRANSLATION_TOOL],
        tool_choice: { type: "tool", name: TOOL_NAME },
      });

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );
      if (!toolUse) {
        throw new Error(
          `Anthropic response contained no tool_use block (stop_reason: ${response.stop_reason}).`,
        );
      }
      return toolUse.input;
    },
  };
}
