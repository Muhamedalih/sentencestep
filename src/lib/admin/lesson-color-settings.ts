/**
 * Shared shape for the admin-configured Lesson Player color roles (see
 * supabase/migrations/20250145000000_lesson_color_settings.sql). Its own
 * small module — no Supabase imports — so both the server-only
 * lesson-color-settings-queries.ts/-actions.ts and the client-only
 * lesson-color-settings-customizer.tsx can import the same roster, defaults,
 * and CSS text builder without either side pulling in code it can't run.
 * Mirrors src/lib/admin/lesson-completion-theme.ts.
 *
 * Deliberately NOT one entry per raw CSS custom property in the app. Each
 * role here is a single, meaningful learner-facing visual (an underline, a
 * letter state, an avatar, an illustration stroke...), picked to match
 * exactly what src/app/globals.css's .lesson-shell block exposes as
 * --lesson-*. Exposing every token in the app (--card, --border, --input...)
 * would let an admin accidentally break layouts/contrast that were never
 * meant to be theatrical; this roster is the deliberately narrow subset that
 * is.
 */
export type LessonColorRole =
  | "lessonPrimary"
  | "lessonSecondary"
  | "lessonAccent"
  | "lessonUnderline"
  | "lessonLetterPending"
  | "lessonLetterCorrect"
  | "lessonLetterWrong"
  | "lessonTitle"
  | "lessonSubtitle"
  | "lessonStoryLabel"
  | "lessonSpeaker"
  | "lessonIcon"
  | "lessonIllustrationStroke"
  | "lessonIllustrationAccent"
  | "lessonXp"
  | "lessonBookCover"
  | "lessonBookCoverForeground";

export interface LessonColorRoleMeta {
  key: LessonColorRole;
  /** The --lesson-* custom property this role writes to inside .lesson-shell (see globals.css). */
  cssVar: string;
  group: "Global" | "Lesson Player" | "Conversation / Stories" | "Rewards" | "Book Reading";
  label: string;
  description: string;
}

/**
 * The full, deliberately-curated roster shown in Admin -> Color Settings,
 * grouped exactly as the product spec asked for. Order here is display
 * order within each group.
 */
export const LESSON_COLOR_ROLES: LessonColorRoleMeta[] = [
  {
    key: "lessonPrimary",
    cssVar: "--lesson-primary",
    group: "Global",
    label: "Primary / brand color",
    description:
      "The lesson player's base brand color. Several roles below (underline, story label, speaker, icons, illustration stroke) default to this unless you customize them individually.",
  },
  {
    key: "lessonSecondary",
    cssVar: "--lesson-secondary",
    group: "Global",
    label: "Secondary brand color",
    description:
      "A muted tint of the brand color — used for the listener's chat bubble/avatar background.",
  },
  {
    key: "lessonAccent",
    cssVar: "--lesson-accent",
    group: "Global",
    label: "Accent color",
    description:
      "The warm accent color. Illustration props and rewards default to this unless customized individually.",
  },
  {
    key: "lessonUnderline",
    cssVar: "--lesson-underline",
    group: "Lesson Player",
    label: "Typing underline",
    description: "The moving bar under the letter the learner is currently typing.",
  },
  {
    key: "lessonLetterPending",
    cssVar: "--lesson-letter-pending",
    group: "Lesson Player",
    label: "Pending letters",
    description: "Letters the learner hasn't typed yet.",
  },
  {
    key: "lessonLetterCorrect",
    cssVar: "--lesson-letter-correct",
    group: "Lesson Player",
    label: "Correct letters",
    description: "Letters already typed correctly.",
  },
  {
    key: "lessonLetterWrong",
    cssVar: "--lesson-letter-wrong",
    group: "Lesson Player",
    label: "Wrong letters",
    description: "A letter typed incorrectly.",
  },
  {
    key: "lessonTitle",
    cssVar: "--lesson-title",
    group: "Lesson Player",
    label: "Titles",
    description: "The current word shown above the sentence.",
  },
  {
    key: "lessonSubtitle",
    cssVar: "--lesson-subtitle",
    group: "Lesson Player",
    label: "Labels",
    description:
      "Secondary text: the current word's translation and the sentence's support-language line.",
  },
  {
    key: "lessonSpeaker",
    cssVar: "--lesson-speaker",
    group: "Conversation / Stories",
    label: "Speaker / avatar",
    description: "Conversation mode's speaker avatar bubbles.",
  },
  {
    key: "lessonStoryLabel",
    cssVar: "--lesson-story-label",
    group: "Conversation / Stories",
    label: "Story label",
    description: 'The "Story" badge and the numbered transcript in Stories mode.',
  },
  {
    key: "lessonIllustrationStroke",
    cssVar: "--lesson-illustration-stroke",
    group: "Conversation / Stories",
    label: "Illustration stroke",
    description: "The line color of every hand-drawn lesson-topic figure.",
  },
  {
    key: "lessonIllustrationAccent",
    cssVar: "--lesson-illustration-accent",
    group: "Conversation / Stories",
    label: "Illustration accent",
    description: "The warm prop color inside each hand-drawn lesson-topic scene.",
  },
  {
    key: "lessonIcon",
    cssVar: "--lesson-icon",
    group: "Rewards",
    label: "Icons",
    description:
      "Playback/replay icons in the lesson player (pronunciation button, speed control).",
  },
  {
    key: "lessonXp",
    cssVar: "--lesson-xp",
    group: "Rewards",
    label: "XP / reward accent",
    description: "The streak flame and XP-earned badge shown on Book Reading completion.",
  },
  {
    key: "lessonBookCover",
    cssVar: "--lesson-book-cover",
    group: "Book Reading",
    label: "Book cover color",
    description:
      "The cover panel color on the Book Reading Section Intro and Book Completion screens — independent of the Primary/brand color above, so it can be set to an off-white/cream tone (or anything else) without recoloring the rest of the lesson player.",
  },
  {
    key: "lessonBookCoverForeground",
    cssVar: "--lesson-book-cover-foreground",
    group: "Book Reading",
    label: "Book cover text",
    description:
      "Text and icon color on the book cover above — pair the two when customizing (e.g. a light/cream cover needs a dark cover text, not the default light one) so the cover stays readable.",
  },
];

/**
 * Light-theme hex equivalent of each role's actual default (a CSS var
 * chain — see .lesson-shell in globals.css), computed once from the same
 * oklch values :root declares. Display/seed value only: shown in the admin
 * UI as "Default" and used to pre-fill the color picker the moment an admin
 * starts customizing a role. Never used to decide what a learner actually
 * sees — an unconfigured role always renders via the live CSS var chain
 * (correct in both light and dark), never this hex.
 */
export const LESSON_COLOR_REFERENCE_HEX: Record<LessonColorRole, string> = {
  lessonPrimary: "#3d47c3",
  lessonSecondary: "#e1e7fd",
  lessonAccent: "#f2a618",
  lessonUnderline: "#3d47c3",
  lessonLetterPending: "#5e636f",
  lessonLetterCorrect: "#12161f",
  lessonLetterWrong: "#f1383e",
  lessonTitle: "#12161f",
  lessonSubtitle: "#5e636f",
  lessonStoryLabel: "#3d47c3",
  lessonSpeaker: "#3d47c3",
  lessonIcon: "#3d47c3",
  lessonIllustrationStroke: "#3d47c3",
  lessonIllustrationAccent: "#f2a618",
  lessonXp: "#f2a618",
  lessonBookCover: "#3d47c3",
  lessonBookCoverForeground: "#faf9fd",
};

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

/** What's actually stored: only the roles an admin has explicitly overridden. A missing key means "use the code-level default" (see globals.css). */
export type LessonColorSettings = Partial<Record<LessonColorRole, string>>;

export const DEFAULT_LESSON_COLOR_SETTINGS: LessonColorSettings = {};

const VALID_ROLES = new Set<string>(LESSON_COLOR_ROLES.map((role) => role.key));

/**
 * Clamps/sanitizes an arbitrary object into a valid LessonColorSettings,
 * dropping any unknown key and any value that isn't a strict 6-digit hex
 * color — used by the save action so a malformed payload can never corrupt
 * the stored row, inject CSS, or crash the learner-facing render.
 */
export function sanitizeLessonColorSettings(input: unknown): LessonColorSettings {
  if (typeof input !== "object" || input === null) return {};

  const result: LessonColorSettings = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!VALID_ROLES.has(key)) continue;
    if (typeof value !== "string" || !HEX_COLOR_RE.test(value)) continue;
    result[key as LessonColorRole] = value.toLowerCase();
  }
  return result;
}

/**
 * Builds the `.lesson-shell { --lesson-x: #hex; ... }` CSS text LearnLayout
 * injects, containing only the roles actually overridden — every other
 * --lesson-* custom property keeps resolving through globals.css's own
 * defaults. Input is assumed already sanitized (server actions/queries only
 * ever hand this function their own sanitizeLessonColorSettings output), so
 * this never needs to re-validate — it just interpolates hex strings that
 * are already guaranteed to match /^#[0-9a-f]{6}$/i, which can't contain `{`,
 * `}`, `;`, or `:` and therefore can't break out of the declaration it's
 * placed in.
 */
export function buildLessonColorCss(settings: LessonColorSettings): string {
  const entries = Object.entries(settings) as [LessonColorRole, string][];
  if (entries.length === 0) return "";

  const roleByKey = new Map(LESSON_COLOR_ROLES.map((role) => [role.key, role]));
  const declarations = entries
    .map(([key, value]) => {
      const role = roleByKey.get(key);
      if (!role) return null;
      return `  ${role.cssVar}: ${value};`;
    })
    .filter((line): line is string => line !== null);

  if (declarations.length === 0) return "";
  return `.lesson-shell {\n${declarations.join("\n")}\n}`;
}
