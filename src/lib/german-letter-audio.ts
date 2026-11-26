"use client";

import { alphabetEntry, germanLetterClipUrl } from "@/lib/german-alphabet";
import type { GermanClipKind } from "@/lib/german-alphabet";

/**
 * Plays the recorded German clips of a letter (its name, then its example word). Only recorded files are
 * ever played: the browser's own speech voice is never used for a German letter, so a missing file or a
 * blocked player is simply silence, never a wrong voice.
 */
let current: HTMLAudioElement | null = null;
let token = 0;

function play(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    current = audio;
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

export function stopGermanLetterAudio() {
  token += 1;
  current?.pause();
  current = null;
}

export async function playGermanLetter(
  letter: string,
  parts: readonly GermanClipKind[] = ["name", "word"],
) {
  const entry = alphabetEntry(letter);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!entry || !base) return;
  stopGermanLetterAudio();
  const mine = token;
  for (const kind of parts) {
    if (mine !== token) return;
    await play(germanLetterClipUrl(base, entry.key, kind));
  }
}
