import type {
  DirectorSentenceInput,
  SentenceDirection,
  VoiceDirector,
  VoiceEmotion,
  VoiceEnergy,
  VoicePace,
  VoicePause,
} from "@/lib/voice/director-types";

/**
 * A deterministic, rule-based Voice Director requiring no external LLM call
 * — the fallback director-registry.ts returns whenever ANTHROPIC_API_KEY
 * isn't configured. It implements the same VoiceDirector interface as
 * createAnthropicVoiceDirector (director.ts) and returns output shaped
 * exactly like that tool call's raw input, so it flows through
 * validateVoiceDirectionOutput and direction-to-tags.ts completely
 * unchanged — everything downstream of getVoiceDirector() has no idea which
 * implementation produced a given direction.
 *
 * The heuristic mirrors director.ts's own system prompt in spirit: most
 * sentences are "neutral" (mirrors buildSystemPrompt's "reserve non-neutral
 * emotion for sentences where it's genuinely warranted"), keyword-triggered
 * emotions never repeat back-to-back on consecutive sentences (mirrors "only
 * the sentence that most needs the emphasis should carry a strong emotion
 * tag" for a sustained beat), and a sentence following a hush/pause cue
 * inherits a short pause before it starts. It reads the whole ordered
 * sentence list in one pass, carrying state (the previous sentence's emotion
 * and whether it ended on a hush) from one sentence to the next — the same
 * "full story context" director.ts gets by being handed every sentence at
 * once rather than one in isolation.
 */

interface EmotionRule {
  emotion: VoiceEmotion;
  keywords: string[];
}

/** Checked in order; the first matching rule wins. Keyword lists are deliberately small and literal — this is pattern-matching, not language understanding. */
const EMOTION_RULES: EmotionRule[] = [
  { emotion: "whispering", keywords: ["whisper", "hushed", "murmur"] },
  { emotion: "crying", keywords: ["cried", "crying", "sobbed", "tears"] },
  { emotion: "sad", keywords: ["grief", "lonely", "sorrow", "heartbroken", "devastated"] },
  { emotion: "angry", keywords: ["furious", "shouted", "yelled", "snapped angrily", "glared"] },
  { emotion: "sighing", keywords: ["sighed", "sigh"] },
  { emotion: "laughing", keywords: ["laughed", "chuckled", "giggled"] },
  { emotion: "mischievous", keywords: ["smirked", "mischiev", "sneaked", "snuck"] },
  {
    emotion: "excited",
    keywords: ["thrilled", "amazing", "wonderful", "cheered", "couldn't believe my luck"],
  },
  { emotion: "happy", keywords: ["smiled", "relief", "relieved", "so glad", "delighted"] },
  { emotion: "curious", keywords: ["wondered", "curious", "puzzled", "confused"] },
];

/** Lowers energy/pace even when no EMOTION_RULES keyword matched — a stilled, tense beat isn't always a named emotion. */
const HUSH_HINTS = [
  "quiet",
  "silence",
  "silent",
  "still",
  "froze",
  "frozen",
  "held the",
  "paused",
  "stopped talking",
  "went silent",
];

/** Raises energy/pace even under a "neutral" emotion — urgency without a named emotion word. */
const URGENCY_HINTS = ["suddenly", "quickly", "rushed", "hurried", "scrambled"];

const TENSION_HINTS = [
  "suddenly",
  "gasp",
  "scream",
  "afraid",
  "nervous",
  "heart",
  "worry",
  "worried",
  "shock",
  "surpris",
  "wait",
  "silence",
  "quiet",
  "froze",
];

/** Single words that read naturally as the one stressed word in a spoken sentence — checked as whole tokens, never invented, always copied verbatim from the sentence's own text so validateVoiceDirectionOutput's literal-substring check always passes. */
const EMPHASIS_CANDIDATES = new Set([
  "never",
  "finally",
  "suddenly",
  "only",
  "exactly",
  "completely",
  "nothing",
  "everything",
  "nobody",
  "everyone",
  "somehow",
  "instead",
  "almost",
  "barely",
  "hardly",
  "still",
  "already",
  "immediately",
  "actually",
  "really",
]);

const TRANSITION_PAUSE_RE =
  /^(then|but|and then|afterward|after a moment|after a while|finally|suddenly)\b/i;
const LONG_PAUSE_RE = /^(finally|after (a|several) (long )?(moment|minute|beat|silence))/i;

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Strips only leading/trailing punctuation — the result stays a literal substring of the original text, which is what validateVoiceDirectionOutput requires of emphasisWord. */
function stripEdgePunctuation(word: string): string {
  return word.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
}

/**
 * Word-boundary matching, not plain substring — a naive `.includes("sigh")`
 * also matches inside "hindSIGHt", `.includes("wait")` inside "waitress",
 * etc. `\bneedle\w*\b` anchors the match to a real word *start* (so "sigh"
 * still matches "sighed"/"sighing" as intended — several keyword entries
 * are deliberately bare stems for exactly this reason — but never matches
 * mid-word) while allowing trailing letters for the same stem-matching
 * cases.
 */
function includesAny(lower: string, needles: string[]): boolean {
  return needles.some((needle) => new RegExp(`\\b${needle}\\w*\\b`).test(lower));
}

function detectEmotion(lower: string): VoiceEmotion {
  for (const rule of EMOTION_RULES) {
    if (includesAny(lower, rule.keywords)) return rule.emotion;
  }
  if (lower.includes("?")) return "curious";
  if (lower.includes("!")) return "excited";
  return "neutral";
}

function detectEnergy(emotion: VoiceEmotion, lower: string): VoiceEnergy {
  if (emotion === "excited" || emotion === "angry" || emotion === "laughing") return "high";
  if (
    emotion === "sad" ||
    emotion === "whispering" ||
    emotion === "sighing" ||
    emotion === "crying"
  )
    return "low";
  if (includesAny(lower, HUSH_HINTS)) return "low";
  if (includesAny(lower, URGENCY_HINTS)) return "high";
  return "medium";
}

function detectPace(emotion: VoiceEmotion, lower: string, tensionHits: number): VoicePace {
  if (emotion === "excited" || emotion === "angry" || emotion === "laughing") return "fast";
  if (includesAny(lower, URGENCY_HINTS)) return "fast";
  if (emotion === "sad" || emotion === "whispering" || emotion === "sighing") return "slow";
  if (includesAny(lower, HUSH_HINTS) || tensionHits >= 2) return "slow";
  return "normal";
}

function detectPauseBefore(text: string, prevEndedOnHush: boolean): VoicePause {
  const trimmed = text.trim();
  if (LONG_PAUSE_RE.test(trimmed)) return "long";
  if (prevEndedOnHush) return "short";
  if (TRANSITION_PAUSE_RE.test(trimmed)) return "short";
  return "none";
}

function pickEmphasisWord(text: string): string | null {
  for (const raw of tokenize(text)) {
    const clean = stripEdgePunctuation(raw);
    if (clean && EMPHASIS_CANDIDATES.has(clean.toLowerCase())) return clean;
  }
  return null;
}

export function createLocalVoiceDirector(): VoiceDirector {
  return {
    name: "local-heuristic",
    async directStory(sentences: DirectorSentenceInput[]): Promise<unknown> {
      let prevEmotion: VoiceEmotion = "neutral";
      let prevEndedOnHush = false;
      const out: SentenceDirection[] = [];

      for (const s of sentences) {
        const lower = s.en.toLowerCase();
        let emotion = detectEmotion(lower);
        // Never repeat the same non-neutral emotion on consecutive
        // sentences — one sustained beat should carry its emotion once, not
        // re-trigger it on every sentence describing it.
        if (emotion !== "neutral" && emotion === prevEmotion) emotion = "neutral";

        const tensionHits = TENSION_HINTS.filter((w) =>
          new RegExp(`\\b${w}\\w*\\b`).test(lower),
        ).length;
        const energy = detectEnergy(emotion, lower);
        const pace = detectPace(emotion, lower, tensionHits);
        const pauseBefore = detectPauseBefore(s.en, prevEndedOnHush);
        const emphasisWord =
          emotion !== "neutral" || tensionHits > 0 ? pickEmphasisWord(s.en) : null;

        out.push({ sentenceId: s.id, emotion, energy, pace, emphasisWord, pauseBefore });

        prevEmotion = emotion;
        prevEndedOnHush = includesAny(lower, HUSH_HINTS);
      }

      return { sentences: out };
    },
  };
}
