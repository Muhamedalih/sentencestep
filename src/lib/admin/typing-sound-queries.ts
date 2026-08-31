import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_TYPING_SOUND_SETTINGS,
  sanitizeSectionSentenceCompleteSounds,
} from "@/lib/admin/typing-sound-settings";
import type { TypingSoundSettings } from "@/lib/admin/typing-sound-settings";
import { SOUND_PACK_NAMES } from "@/lib/typing-sound-packs";
import type { SoundPack } from "@/lib/typing-sound-packs";
import { SENTENCE_COMPLETE_SOUND_NAMES } from "@/lib/sentence-complete-sounds";
import type { SentenceCompleteSound } from "@/lib/sentence-complete-sounds";

function isSoundPack(value: string): value is SoundPack {
  return (SOUND_PACK_NAMES as string[]).includes(value);
}

function isSentenceCompleteSound(value: string): value is SentenceCompleteSound {
  return (SENTENCE_COMPLETE_SOUND_NAMES as string[]).includes(value);
}

/**
 * Reads the one admin-configured typing sound row. Called both from the
 * admin typing-sound page (to show the current selection) and from
 * src/app/learn/layout.tsx (to hand the same preference to every learner's
 * TypingSoundSettingsProvider) — same read, same fallback, so an
 * unconfigured project behaves identically in both places.
 */
export async function getTypingSoundSettings(): Promise<TypingSoundSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_TYPING_SOUND_SETTINGS;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("typing_sound_settings")
    .select(
      "enabled, sound_pack, volume, sentence_complete_sound, section_sentence_complete_sounds",
    )
    .eq("id", 1)
    .maybeSingle();

  // Selecting an unknown column fails the WHOLE query (not just that
  // field), which would otherwise silently discard an admin's real
  // enabled/soundPack/volume/sentenceCompleteSound customizations — not
  // just the new section-overrides column — for as long as
  // 20250210000000_typing_sound_sections_and_variety.sql's ADD COLUMN
  // hasn't been applied yet. Falling back to a narrower select of exactly
  // the columns that existed before this feature keeps every
  // already-customized value intact during that gap; only the section
  // overrides go empty (their own code-level defaults) until the
  // migration runs.
  if (error) {
    const legacy = await supabase
      .from("typing_sound_settings")
      .select("enabled, sound_pack, volume, sentence_complete_sound")
      .eq("id", 1)
      .maybeSingle();
    if (legacy.error || !legacy.data) return DEFAULT_TYPING_SOUND_SETTINGS;
    return {
      enabled: legacy.data.enabled,
      soundPack: isSoundPack(legacy.data.sound_pack)
        ? legacy.data.sound_pack
        : DEFAULT_TYPING_SOUND_SETTINGS.soundPack,
      volume: legacy.data.volume,
      sentenceCompleteSound: isSentenceCompleteSound(legacy.data.sentence_complete_sound)
        ? legacy.data.sentence_complete_sound
        : DEFAULT_TYPING_SOUND_SETTINGS.sentenceCompleteSound,
      sectionSentenceCompleteSounds: DEFAULT_TYPING_SOUND_SETTINGS.sectionSentenceCompleteSounds,
    };
  }

  if (!data) return DEFAULT_TYPING_SOUND_SETTINGS;

  return {
    enabled: data.enabled,
    soundPack: isSoundPack(data.sound_pack)
      ? data.sound_pack
      : DEFAULT_TYPING_SOUND_SETTINGS.soundPack,
    volume: data.volume,
    sentenceCompleteSound: isSentenceCompleteSound(data.sentence_complete_sound)
      ? data.sentence_complete_sound
      : DEFAULT_TYPING_SOUND_SETTINGS.sentenceCompleteSound,
    // A null/missing column (a row written before this column existed)
    // falls back to the same three curated defaults every fresh install
    // gets, rather than going empty — sanitize only ever narrows an actual
    // stored object, so this covers the "column exists but was never set"
    // case explicitly.
    sectionSentenceCompleteSounds:
      data.section_sentence_complete_sounds &&
      typeof data.section_sentence_complete_sounds === "object"
        ? sanitizeSectionSentenceCompleteSounds(data.section_sentence_complete_sounds)
        : DEFAULT_TYPING_SOUND_SETTINGS.sectionSentenceCompleteSounds,
  };
}
