"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useVoiceSettings } from "@/components/providers/voice-settings-provider";
import { getBestVoice, rankVoices, toVoiceInfo } from "@/lib/speech";
import type { VoiceSettings } from "@/lib/admin/voice-settings";

/**
 * Picks which voice this device should actually speak with, in priority
 * order: (1) the admin's configured voice (see tts_settings), matched by
 * exact name — and lang, when given, as a tie-breaker — against this
 * browser's own live voice list; (2) if that voice doesn't exist here
 * (different OS/browser than whatever machine the admin configured it on),
 * the best-ranked English voice this device happens to have. Pronunciation
 * is never silently dropped just because the admin's exact pick isn't
 * installed locally.
 */
function matchVoice(
  list: SpeechSynthesisVoice[],
  settings: VoiceSettings,
): SpeechSynthesisVoice | null {
  if (settings.voiceName) {
    const exact = list.find(
      (voice) =>
        voice.name === settings.voiceName &&
        (!settings.voiceLang || voice.lang === settings.voiceLang),
    );
    if (exact) return exact;
  }
  const best = getBestVoice(list.map(toVoiceInfo));
  if (!best) return null;
  return list.find((voice) => voice.voiceURI === best.voiceURI) ?? null;
}

interface SpeakOverrides {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Thin browser-facing wrapper around the Web Speech API. The admin's
 * configured default (voice + rate/pitch/volume, read once server-side and
 * handed down via VoiceSettingsProvider) drives normal playback; all the
 * device-side matching/fallback logic lives in matchVoice above and the
 * pure ranking functions in src/lib/speech.ts (unit-tested there). Kept
 * separate from any lesson component for the same reason as before: the
 * rest of the learner UI never needs to know a browser voice — or an admin
 * preference — is involved at all.
 *
 * There is deliberately no paid TTS dependency here — voice *selection*
 * among whatever free system voices a device already ships, now steered by
 * one admin-configured default with automatic per-device fallback, is the
 * whole strategy.
 */
export function useSpeech() {
  const voiceSettings = useVoiceSettings();
  const voiceSettingsRef = useRef(voiceSettings);
  voiceSettingsRef.current = voiceSettings;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  // False until the voice list has resolved at least once (either
  // synchronously here, or asynchronously via `voiceschanged`). Auto-play
  // callers (see PronunciationButton) wait on this before speaking — calling
  // speechSynthesis.speak() while Chrome still reports zero voices is a
  // known source of silently-dropped utterances, which is why a sentence's
  // very first auto-play (right after mount, before voices have loaded) was
  // unreliable while the manual replay button — clicked well after voices
  // had settled — always worked.
  const [voicesReady, setVoicesReady] = useState(false);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setIsSupported(true);

    function loadVoices() {
      const list = window.speechSynthesis.getVoices();
      if (list.length === 0) return; // Chrome briefly reports zero voices before `voiceschanged` fires.
      setVoices(list);
      selectedVoiceRef.current = matchVoice(list, voiceSettingsRef.current);
      setVoicesReady(true);

      if (process.env.NODE_ENV !== "production") {
        logVoiceSelectionForDev(list, selectedVoiceRef.current, voiceSettingsRef.current);
      }
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    // Never wait indefinitely: some browsers/platforms never fire
    // `voiceschanged` at all (or ship with no voices), so without this a
    // sentence with autoPlay would simply never speak on them. playText
    // already degrades gracefully with no voice selected (falls back to the
    // browser's own default for the given lang), so it's safe to just
    // proceed after a short grace period.
    const fallbackTimer = window.setTimeout(() => setVoicesReady(true), 1000);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // The one real primitive — every public speak function below is a thin,
  // separately-named wrapper around this so call sites stay
  // self-documenting (speakSentence vs. speakWord vs. replaySentence) even
  // though the underlying behavior is identical today. Always cancels any
  // in-flight utterance first: this is what makes rapid word clicks, a
  // mid-playback replay press, or a new sentence's auto-play never queue or
  // overlap — each call is "cancel whatever's playing, then play this,"
  // never "play this after whatever's currently queued." Wrapped in
  // try/catch so a browser autoplay/security policy blocking speech (or any
  // other device-specific speechSynthesis failure) fails silently instead
  // of throwing through a render — the Replay button, which calls this same
  // function from a real click, stays available as the manual fallback.
  const playText = useCallback((text: string, overrides?: SpeakOverrides) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();

      const settings = voiceSettingsRef.current;
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = overrides?.voice ?? selectedVoiceRef.current;
      utterance.lang = voice?.lang || "en-US";
      utterance.rate = overrides?.rate ?? settings.rate;
      utterance.pitch = overrides?.pitch ?? settings.pitch;
      utterance.volume = overrides?.volume ?? settings.volume;
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // rateMultiplier stacks on top of the admin-configured base rate (never a
  // fixed absolute value) — see PronunciationSettingsProvider's doc comment
  // for why. Defaults to 1 so every existing call site (speakWord, and
  // speakSentence/replaySentence calls that don't pass one) is unaffected.
  const speakSentence = useCallback(
    (text: string, rateMultiplier = 1) =>
      playText(text, { rate: voiceSettingsRef.current.rate * rateMultiplier }),
    [playText],
  );
  const speakWord = useCallback((text: string) => playText(text), [playText]);
  const replaySentence = useCallback(
    (text: string, rateMultiplier = 1) =>
      playText(text, { rate: voiceSettingsRef.current.rate * rateMultiplier }),
    [playText],
  );

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Nothing to recover — cancel() failing just means nothing was playing.
      }
    }
    setIsSpeaking(false);
  }, []);

  const getAvailableEnglishVoices = useCallback(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith("en")),
    [voices],
  );

  const getSelectedVoice = useCallback(() => selectedVoiceRef.current, []);

  /**
   * Admin-only: audition an arbitrary voice with arbitrary rate/pitch/volume
   * without touching the persisted selection this hook otherwise plays
   * with — see voice-settings-form.tsx, which lets the admin preview any
   * detected voice before saving it as the new default.
   */
  const previewVoice = useCallback(
    (voiceURI: string, text: string, params: { rate: number; pitch: number; volume: number }) => {
      const voice = voices.find((candidate) => candidate.voiceURI === voiceURI);
      playText(text, { voice, ...params });
    },
    [voices, playText],
  );

  return {
    speakSentence,
    speakWord,
    replaySentence,
    stopSpeech,
    previewVoice,
    isSpeaking,
    isSupported,
    voicesReady,
    getAvailableEnglishVoices,
    getSelectedVoice,
  };
}

/**
 * Console-only diagnostic (never rendered in the learner-facing UI) so the
 * actual detected/selected voice on a given machine — and whether it came
 * from the admin's exact preference or the device fallback — can be
 * inspected during development.
 */
function logVoiceSelectionForDev(
  list: SpeechSynthesisVoice[],
  selected: SpeechSynthesisVoice | null,
  settings: VoiceSettings,
): void {
  const ranked = rankVoices(list.map(toVoiceInfo));
  const matchedAdminChoice = Boolean(settings.voiceName && selected?.name === settings.voiceName);
  console.groupCollapsed(
    `[useSpeech] ${ranked.length} English voice(s) found — selected: ${selected?.name ?? "none"}` +
      (settings.voiceName
        ? ` (${matchedAdminChoice ? "admin preference" : "device fallback"})`
        : ""),
  );
  console.table(
    ranked.map(({ voice, score, reasons }) => ({
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      score,
      reasons: reasons.join("; "),
    })),
  );
  console.groupEnd();
}
