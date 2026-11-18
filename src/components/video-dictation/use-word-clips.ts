"use client";

import { useCallback, useEffect, useRef } from "react";

import { useSpeech } from "@/hooks/use-speech";

/**
 * Says a word of the video in the recorded Word Lists voice (Emma) when there is a clip for it. With
 * `silentWithoutClip` a word with no clip stays silent; otherwise the device's own voice stands in
 * (only the review cards use that: the training round asks only words that have a clip).
 */
export function useWordClips(
  clips: Readonly<Record<string, string>>,
  options: { silentWithoutClip?: boolean } = {},
) {
  const { speakWord } = useSpeech();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silent = options.silentWithoutClip ?? false;

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  return useCallback(
    (word: string) => {
      const url = clips[word.toLowerCase().replace(/[^\p{L}']/gu, "")];
      if (!url) {
        if (!silent) speakWord(word);
        return;
      }
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => undefined);
    },
    [clips, silent, speakWord],
  );
}
