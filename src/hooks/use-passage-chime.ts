"use client";

import { useCallback, useEffect, useRef } from "react";

import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { createChimeBus, scheduleCorrectChime } from "@/lib/passages/chime";
import type { ChimeBus } from "@/lib/passages/chime";

/**
 * Plays the "right answer" chime (see src/lib/passages/chime.ts). It follows
 * the app's one global sound setting — Admin -> Typing sound: switched off
 * there, Passages is silent too, and the volume is that slider's — so there is
 * no separate switch to find. The audio context is made on the first answer (a
 * click, so the browser allows it) and reused; it is closed with the reader.
 */
export function usePassageChime() {
  const { enabled, volume } = useTypingSoundSettings();
  const contextRef = useRef<AudioContext | undefined>(undefined);
  const busRef = useRef<ChimeBus | undefined>(undefined);

  useEffect(() => {
    return () => {
      void contextRef.current?.close();
      contextRef.current = undefined;
      busRef.current = undefined;
    };
  }, []);

  const playCorrect = useCallback(() => {
    if (!enabled || volume <= 0) return;
    try {
      if (!contextRef.current || contextRef.current.state === "closed") {
        contextRef.current = new AudioContext();
        busRef.current = undefined;
      }
      const ctx = contextRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      busRef.current ??= createChimeBus(ctx);
      scheduleCorrectChime(ctx, busRef.current, volume);
    } catch {
      // Audio can be blocked or missing; a missed chime is not worth an error.
    }
  }, [enabled, volume]);

  return { playCorrect };
}
