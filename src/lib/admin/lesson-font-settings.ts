import { LEARNING_SECTION_NAMES } from "@/lib/admin/learning-sections";
import type { LearningSection } from "@/lib/admin/learning-sections";

/**
 * Shared shape for the admin-configured per-section sentence font (see
 * supabase/migrations/20250211000000_lesson_font_settings.sql). Its own
 * small module — no Supabase imports — so both the server-only
 * lesson-font-queries.ts/lesson-font-actions.ts and the client-only
 * lesson-font-settings-form.tsx/lesson-font-settings-provider.tsx can import
 * the same roster/type/defaults without either side pulling in code it
 * can't run. Mirrors src/lib/admin/lesson-color-settings.ts's shape:
 * "only what's overridden is stored, a missing key means keep today's
 * code-level default" — which is what makes an unconfigured install render
 * pixel-identical to before this feature existed.
 *
 * Deliberately a small, curated set of system/web-safe font *stacks*, not a
 * free-text field or a webfont loader: every value here resolves from fonts
 * already on the learner's device (or Tailwind's own generic fallback), so
 * there's no font file to fetch, no flash-of-unstyled-text, and no risk of
 * an admin typing an unavailable font name that silently falls back to
 * nothing. Deliberately excludes any script/cursive stack too — this is
 * applied to the exact sentence the learner must read character-by-character
 * to type it correctly, so legibility always outranks novelty here.
 */
export type FontChoice =
  | "classicSerif"
  | "modernSerif"
  | "roundedFriendly"
  | "geometricSans"
  | "monospaceTech"
  | "classicTypewriter";

export interface FontChoiceMeta {
  key: FontChoice;
  label: string;
  description: string;
  /** The actual CSS font-family value — applied as an inline style, never a class, since the chosen value is only known at request time (an admin-picked DB value), not at build time. */
  cssValue: string;
}

export const FONT_CHOICES: FontChoiceMeta[] = [
  {
    key: "classicSerif",
    label: "Classic serif",
    description:
      "A timeless book serif — Georgia's family. Warm and highly readable at large sizes.",
    cssValue: 'Georgia, Cambria, "Times New Roman", Times, serif',
  },
  {
    key: "modernSerif",
    label: "Modern serif",
    description:
      "A refined literary serif with the OS's own serif design — a quieter, more editorial feel.",
    cssValue: 'ui-serif, "Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
  },
  {
    key: "roundedFriendly",
    label: "Rounded & friendly",
    description:
      "Soft, rounded letterforms — approachable and a little playful, good for lighter content.",
    cssValue: 'ui-rounded, "SF Pro Rounded", "Segoe UI Rounded", Nunito, sans-serif',
  },
  {
    key: "geometricSans",
    label: "Geometric sans",
    description: "Clean, geometric letterforms with plenty of confidence — a modern, branded feel.",
    cssValue: 'Futura, "Century Gothic", "Segoe UI", sans-serif',
  },
  {
    key: "monospaceTech",
    label: "Monospace",
    description:
      "Fixed-width and precise — every character the same width, good for a technical feel.",
    cssValue: 'ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", Consolas, monospace',
  },
  {
    key: "classicTypewriter",
    label: "Typewriter",
    description: "A retro Courier feel — pairs naturally with the Typewriter keystroke sound pack.",
    cssValue: '"Courier New", Courier, monospace',
  },
];

export const FONT_CHOICE_NAMES = FONT_CHOICES.map((choice) => choice.key);

const FONT_CHOICE_BY_KEY = new Map(FONT_CHOICES.map((choice) => [choice.key, choice]));

/** What's actually stored: only the sections an admin has explicitly assigned a font to. A missing key means "keep the code-level default font for that section" (Stories' own serif included). */
export type LessonFontSettings = Partial<Record<LearningSection, FontChoice>>;

export const DEFAULT_LESSON_FONT_SETTINGS: LessonFontSettings = {};

const VALID_SECTIONS = new Set<string>(LEARNING_SECTION_NAMES);
const VALID_FONTS = new Set<string>(FONT_CHOICE_NAMES);

/**
 * Clamps/sanitizes an arbitrary object into a valid LessonFontSettings,
 * dropping any unknown section key and any value that isn't a real
 * FontChoice name — used by the save action so a malformed payload can
 * never corrupt the stored row or hand an invalid value to
 * resolveSectionFontFamily. Mirrors sanitizeLessonColorSettings.
 */
export function sanitizeLessonFontSettings(input: unknown): LessonFontSettings {
  if (typeof input !== "object" || input === null) return {};

  const result: LessonFontSettings = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!VALID_SECTIONS.has(key)) continue;
    if (typeof value !== "string" || !VALID_FONTS.has(value)) continue;
    result[key as LearningSection] = value as FontChoice;
  }
  return result;
}

/**
 * The actual CSS font-family value a section's sentence text should use, or
 * `undefined` when the admin hasn't assigned that section a font — callers
 * apply this as an inline `style={{ fontFamily }}` only when it's defined,
 * so an unconfigured section keeps its exact current markup/classes
 * (e.g. Stories' own `font-serif` Tailwind utility) untouched.
 */
export function resolveSectionFontFamily(
  settings: LessonFontSettings,
  section: LearningSection,
): string | undefined {
  const choice = settings[section];
  if (!choice) return undefined;
  return FONT_CHOICE_BY_KEY.get(choice)?.cssValue;
}
