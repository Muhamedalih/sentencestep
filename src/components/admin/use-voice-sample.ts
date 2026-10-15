"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Plays the short sample of a voice (see scripts/generate-voice-samples.ts) — one at a time:
 * pressing another voice stops the first, pressing the playing one stops it. Shared by the
 * passage's voice picker and the "Voices for all passages" card.
 */
export function useVoiceSample() {
  const [sampling, setSampling] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  function toggleSample(voice: { id: string; sampleAudioUrl: string | null } | undefined) {
    if (!voice?.sampleAudioUrl) return;
    audioRef.current?.pause();
    if (sampling === voice.id) {
      setSampling(null);
      return;
    }
    const audio = new Audio(voice.sampleAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setSampling(null);
    setSampling(voice.id);
    audio.play().catch(() => setSampling(null));
  }

  return { sampling, toggleSample };
}
