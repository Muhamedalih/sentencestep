import Anthropic from "@anthropic-ai/sdk";

import type { DirectorSentenceInput, VoiceDirector } from "@/lib/voice/director-types";

/**
 * The only file that imports @anthropic-ai/sdk for the Voice Director —
 * mirrors src/lib/translation/anthropic-provider.ts's exact shape (strict
 * tool schema, tool_choice forced, raw untyped tool input returned for
 * director-validate.ts to check). Everything else (story-voice-generation.ts)
 * goes through the VoiceDirector interface instead.
 */

export const DEFAULT_VOICE_DIRECTOR_MODEL = "claude-sonnet-5";

const TOOL_NAME = "submit_voice_direction";

const EMOTIONS = [
  "neutral",
  "excited",
  "curious",
  "sad",
  "happy",
  "whispering",
  "sarcastic",
  "angry",
  "crying",
  "mischievous",
  "sighing",
  "laughing",
] as const;

const DIRECTION_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description:
    "Submit per-sentence voice direction for a story or conversation, one entry per input sentence, same order. Call this exactly once.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      sentences: {
        type: "array",
        items: {
          type: "object",
          properties: {
            sentenceId: { type: "string" },
            emotion: { type: "string", enum: [...EMOTIONS] },
            energy: { type: "string", enum: ["low", "medium", "high"] },
            pace: { type: "string", enum: ["slow", "normal", "fast"] },
            emphasisWord: {
              type: ["string", "null"],
              description:
                "A single word to emphasize, or null. Must be a literal substring of that sentence's English text, copied exactly — never invented or reworded.",
            },
            pauseBefore: { type: "string", enum: ["none", "short", "long"] },
          },
          required: ["sentenceId", "emotion", "energy", "pace", "emphasisWord", "pauseBefore"],
          additionalProperties: false,
        },
      },
    },
    required: ["sentences"],
    additionalProperties: false,
  },
};

function buildSystemPrompt(): string {
  return [
    "You are a voice director for SentenceStep, an English-learning app. You decide how a narrator (or, for conversations, each character) should deliver each sentence of a short story/dialogue when it is read aloud by an expressive text-to-speech voice.",
    "",
    "The overwhelming majority of sentences in a natural story are delivered neutrally — plain narration, normal pace, no special emotion. Reserve a non-neutral emotion for the specific sentences where it is genuinely warranted by the story content (a surprising event, a whispered secret, an excited exclamation, a tense pause) — never assign drama to an ordinary descriptive or transitional sentence just because you can.",
    "",
    "Read every sentence in the context of its immediate neighbors (given to you as previous/next in the list) — delivery should flow naturally from one sentence to the next, not reset to neutral and re-trigger the same emotion redundantly on every sentence of one sustained beat. If three sentences in a row describe the same tense moment, only the sentence that most needs the emphasis should carry a strong emotion tag; the others can stay lower-energy or neutral even within that beat.",
    "",
    "emotion: pick exactly one from the given closed set. 'neutral' means no special delivery at all — this should be your default choice more often than not.",
    "energy: low/medium/high — how much vocal energy the delivery carries, independent of emotion (a 'sad' sentence can be low-energy quiet grief or, rarely, high-energy sobbing).",
    "pace: slow/normal/fast — reserve 'fast' for genuine urgency/excitement and 'slow' for suspense or emotional weight; 'normal' is the default.",
    "emphasisWord: at most one single word from that exact sentence to stress, or null for most sentences — must be copied character-for-character from the sentence's own English text, never invented, reworded, or taken from a different sentence.",
    "pauseBefore: 'short'/'long' only where a real dramatic beat calls for a pause before the sentence starts (a reveal, a moment of hesitation); 'none' otherwise, which should be most sentences.",
    "",
    "Call the submit_voice_direction tool exactly once with one entry per input sentence, in the same order, using each sentence's exact given id. Do not add, remove, or reorder entries. Do not ask questions or produce any other output.",
  ].join("\n");
}

function buildUserPrompt(sentences: DirectorSentenceInput[]): string {
  const lines = [
    "Sentences, in order:",
    ...sentences.map(
      (s, i) => `${i + 1}. [id: ${s.id}]${s.speaker ? ` (${s.speaker}):` : ""} ${s.en}`,
    ),
  ];
  return lines.join("\n");
}

export function createAnthropicVoiceDirector(apiKey: string, model: string): VoiceDirector {
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",
    async directStory(sentences: DirectorSentenceInput[]): Promise<unknown> {
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: buildUserPrompt(sentences) }],
        tools: [DIRECTION_TOOL],
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
