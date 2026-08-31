/**
 * Shared shape for the admin-configured Lesson Completion visual theme (see
 * supabase/migrations/20250139000000_lesson_completion_theme.sql). Its own
 * small module — no Supabase imports — so both the server-only
 * lesson-completion-theme-queries.ts/-actions.ts and the client-only
 * lesson-completion.tsx / lesson-completion-customizer.tsx can import the
 * same type, defaults, and CSS-var conversion without either side pulling in
 * code it can't run. Mirrors src/lib/admin/typing-sound-settings.ts.
 *
 * Every field here is presentation only — colors, sizes, spacing, text
 * overrides for static labels. Nothing here can express XP math, mistake
 * counts, navigation targets, or any other lesson-completion *behavior*;
 * that separation is what keeps this system safely bolted onto
 * LessonCompletion without risk of it ever touching that logic.
 *
 * Deliberately small: this used to also carry glow/shadow/gradient/hover-
 * effect knobs for a multi-color "gamified HUD" look (colored rings, glowing
 * pill buttons, per-stat icon colors). That whole visual language was
 * replaced with a flat, near-monochrome design with a single accent color,
 * so every field that only ever painted a now-deleted gradient/glow/badge
 * was removed rather than left as dead admin controls that quietly do
 * nothing. If you're looking for one of those old fields, it's gone on
 * purpose — the fields below are the complete set this screen still reads.
 */
export interface LessonCompletionTheme {
  // Colors — deliberately few: this screen is near-monochrome text on
  // colorBackground, with colorAccent/colorXp as the one accent, used only
  // for the primary button, the XP bar, the earned-XP stat, and the rewards
  // line.
  colorBackground: string;
  colorTextPrimary: string;
  colorTextSecondary: string;
  colorAccent: string;
  colorXp: string;
  colorBorder: string;

  // Typography
  /** The big accuracy number in its own card — this screen's one focal point. */
  heroNumberSize: number;
  headingSize: number;
  bodySize: number;
  statSize: number;
  actionCardTextSize: number;
  headingWeight: number;
  bodyWeight: number;

  // Layout / spacing
  contentWidth: number;
  sectionSpacing: number;
  cardSpacing: number;
  cardPadding: number;
  actionCardHeight: number;
  headerSpacing: number;

  /** Strength of every neutral hairline/wash on this screen (dividers, chip borders, the XP track) — one knob instead of a separate opacity per element. */
  borderOpacity: number;
  progressBarRadius: number;
  progressBarHeight: number;

  // Completion header
  headingText: string;

  // XP section
  xpAnimationDuration: number;

  // Vocabulary section
  vocabTitle: string;
  chipRadius: number;
  chipSpacing: number;

  // Action cards
  actionCardRadius: number;
}

/**
 * Matches today's lesson-completion.tsx design exactly — this is both the
 * fallback used everywhere before any admin customization exists, and the
 * "Default Dark" preset. colorAccent/colorXp default to the site's own
 * --brand purple (see :root .dark in globals.css) so this screen shares an
 * identity with the rest of the app instead of a bespoke palette.
 */
export const DEFAULT_LESSON_COMPLETION_THEME: LessonCompletionTheme = {
  colorBackground: "#0e1218",
  colorTextPrimary: "#ffffff",
  colorTextSecondary: "#a3a3a3",
  colorAccent: "#849bff",
  colorXp: "#849bff",
  colorBorder: "#ffffff",

  heroNumberSize: 72,
  headingSize: 24,
  bodySize: 14,
  statSize: 20,
  actionCardTextSize: 14,
  headingWeight: 600,
  bodyWeight: 500,

  contentWidth: 768,
  sectionSpacing: 20,
  cardSpacing: 12,
  cardPadding: 16,
  actionCardHeight: 104,
  headerSpacing: 8,

  borderOpacity: 12,
  progressBarRadius: 9999,
  progressBarHeight: 6,

  headingText: "",

  /** Medium-slow and deliberate — a satisfying, professional fill rather than a snap. */
  xpAnimationDuration: 1400,

  vocabTitle: "",
  chipRadius: 9999,
  chipSpacing: 8,

  actionCardRadius: 16,
};

interface NumberRange {
  min: number;
  max: number;
  step: number;
}

/** Server-side clamp ranges for every numeric field — also drives the admin sliders' min/max/step. */
export const LESSON_COMPLETION_THEME_RANGES: Record<
  {
    [K in keyof LessonCompletionTheme]: LessonCompletionTheme[K] extends number ? K : never;
  }[keyof LessonCompletionTheme],
  NumberRange
> = {
  heroNumberSize: { min: 40, max: 140, step: 2 },
  headingSize: { min: 16, max: 40, step: 1 },
  bodySize: { min: 10, max: 20, step: 1 },
  statSize: { min: 14, max: 32, step: 1 },
  actionCardTextSize: { min: 10, max: 20, step: 1 },
  headingWeight: { min: 400, max: 900, step: 100 },
  bodyWeight: { min: 400, max: 900, step: 100 },

  contentWidth: { min: 480, max: 1100, step: 8 },
  sectionSpacing: { min: 4, max: 48, step: 1 },
  cardSpacing: { min: 0, max: 32, step: 1 },
  cardPadding: { min: 4, max: 40, step: 1 },
  actionCardHeight: { min: 64, max: 200, step: 1 },
  headerSpacing: { min: 0, max: 32, step: 1 },

  borderOpacity: { min: 0, max: 100, step: 1 },
  progressBarRadius: { min: 0, max: 9999, step: 1 },
  progressBarHeight: { min: 2, max: 20, step: 1 },

  xpAnimationDuration: { min: 0, max: 2500, step: 50 },

  chipRadius: { min: 0, max: 9999, step: 1 },
  chipSpacing: { min: 0, max: 24, step: 1 },

  actionCardRadius: { min: 0, max: 40, step: 1 },
};

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

const COLOR_FIELDS = new Set<keyof LessonCompletionTheme>([
  "colorBackground",
  "colorTextPrimary",
  "colorTextSecondary",
  "colorAccent",
  "colorXp",
  "colorBorder",
]);

/** Clamps/sanitizes an arbitrary object into a valid LessonCompletionTheme, falling back to defaults field-by-field — used by the save action so a malformed payload can never corrupt the stored row or crash the learner-facing render. A stored row from before a field was added/removed just falls back to the default for any field it doesn't have, and any field it has that no longer exists is silently dropped (the loop below only ever reads keys DEFAULT still declares). */
export function sanitizeLessonCompletionTheme(
  input: Partial<Record<keyof LessonCompletionTheme, unknown>>,
): LessonCompletionTheme {
  const result = { ...DEFAULT_LESSON_COMPLETION_THEME };

  for (const key of Object.keys(
    DEFAULT_LESSON_COMPLETION_THEME,
  ) as (keyof LessonCompletionTheme)[]) {
    const value = input[key];
    const fallback = DEFAULT_LESSON_COMPLETION_THEME[key];

    if (typeof fallback === "number") {
      const range =
        LESSON_COMPLETION_THEME_RANGES[key as keyof typeof LESSON_COMPLETION_THEME_RANGES];
      if (typeof value === "number" && Number.isFinite(value) && range) {
        (result[key] as number) = Math.min(range.max, Math.max(range.min, value));
      }
      continue;
    }

    // string fields: hex colors are validated, free text is passed through
    // with a length cap so nothing absurd ends up rendered on the screen.
    if (COLOR_FIELDS.has(key)) {
      if (typeof value === "string" && HEX_COLOR_RE.test(value)) {
        (result[key] as string) = value;
      }
      continue;
    }

    if (typeof value === "string") {
      (result[key] as string) = value.slice(0, 120);
    }
  }

  return result;
}

/** Named visual-only presets an admin can apply instantly, each a full theme built from the default and overriding only its accent (and, for the two dark-tinted ones, the background). */
export const LESSON_COMPLETION_PRESETS: {
  id: string;
  label: string;
  theme: LessonCompletionTheme;
}[] = [
  {
    id: "default-dark",
    label: "Default Dark",
    theme: DEFAULT_LESSON_COMPLETION_THEME,
  },
  {
    id: "emerald-premium",
    label: "Emerald Premium",
    theme: {
      ...DEFAULT_LESSON_COMPLETION_THEME,
      colorBackground: "#03110b",
      colorAccent: "#34d399",
      colorXp: "#34d399",
    },
  },
  {
    id: "cyan-modern",
    label: "Cyan Modern",
    theme: {
      ...DEFAULT_LESSON_COMPLETION_THEME,
      colorBackground: "#030f16",
      colorAccent: "#22d3ee",
      colorXp: "#22d3ee",
    },
  },
  {
    id: "minimal-dark",
    label: "Minimal Dark",
    theme: {
      ...DEFAULT_LESSON_COMPLETION_THEME,
      colorAccent: "#e5e7eb",
      colorXp: "#e5e7eb",
      colorTextSecondary: "#8a8a8a",
    },
  },
];

function mix(hex: string, percent: number): string {
  const clamped = Math.min(100, Math.max(0, percent));
  return `color-mix(in srgb, ${hex} ${clamped}%, transparent)`;
}

/**
 * The handful of composite visual values LessonCompletion needs, precomputed
 * from a theme into ready-to-use inline `style` values — kept as one
 * function so the alpha-blending math for "how strong is a neutral
 * hairline" lives in exactly one place. Pure function, safe to call on both
 * server and client render passes.
 */
export interface LessonCompletionStyles {
  bg: string;
  textPrimary: string;
  textSecondary: string;
  /** Neutral hairline/border, derived from colorBorder + borderOpacity — used for every divider, chip border, and secondary-button border on this screen. */
  border: string;
  /** The XP bar's own track (the unfilled portion) — a faint neutral wash, same strength as `border`. */
  xpTrackBg: string;
}

export function deriveLessonCompletionStyles(theme: LessonCompletionTheme): LessonCompletionStyles {
  return {
    bg: theme.colorBackground,
    textPrimary: theme.colorTextPrimary,
    textSecondary: theme.colorTextSecondary,
    border: mix(theme.colorBorder, theme.borderOpacity),
    xpTrackBg: mix(theme.colorTextPrimary, theme.borderOpacity * 0.7),
  };
}
