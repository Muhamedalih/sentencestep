"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Loader2, Volume2 } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { useSpeech } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";
import type { VoiceAudioContentType } from "@/lib/voice/voice-audio";

/**
 * Plays a sentence's pronunciation. Priority order: (1) a real recorded
 * clip (sentence.audioUrl) when one exists — never regenerated or
 * second-guessed, exactly as before Kokoro existed; (2) the lesson's
 * resolved Kokoro voice (kokoroVoiceId), resolved on demand and cached
 * server-side (see resolvePronunciationAudioAction — cache hit plays
 * immediately, a miss generates once and every learner after that gets the
 * cache hit); (3) the browser's speech synthesis (useSpeech), the original
 * fallback, now also what a failed/unavailable Kokoro resolution degrades
 * to. The rest of the learner UI never needs to know which source was
 * used. Renders nothing if no source is available at all, so it never
 * leaves a dead control on screen.
 */
export function PronunciationButton({
  text,
  audioUrl,
  onPlay,
  className,
  autoPlay = false,
  resetKey,
  inputRef,
  kokoroVoiceId,
  contentType,
  contentId,
  label,
  variant = "ghost",
  size = "icon",
}: {
  text: string;
  audioUrl?: string | null;
  /** Fired once per successful play press, regardless of source — lets a caller record a lightweight "pronunciation was used" signal without this component knowing about analytics. */
  onPlay?: () => void;
  className?: string;
  /** When set, renders as a labeled icon+text button (e.g. Word Lists' Learn view "Replay" control) instead of the default icon-only ghost button. The click/playback/shortcut-registration logic is identical either way. */
  label?: string;
  variant?: "ghost" | "outline" | "secondary";
  size?: "icon" | "sm" | "default";
  /** Pronounce the full text once automatically, the moment `resetKey` changes — the same play logic the manual click uses, so auto-play and replay can never drift apart. */
  autoPlay?: boolean;
  /** Required when autoPlay is set — pass the sentence id, not the text, so re-renders of the same sentence never re-trigger it. */
  resetKey?: string;
  /**
   * The typing session's hidden input. Clicking this button (a real
   * `<button>`) moves DOM focus to it in Chrome/Edge on Windows, so without
   * this the very next keystroke would go nowhere and the learner would
   * have to click the sentence again to keep typing. Refocusing the input
   * right after the click closes that gap — replay and typing stay
   * independent concerns instead of replay silently pausing typing.
   */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** This content's resolved voice (see resolveVoiceId) — null/undefined means no Kokoro voice applies, and behavior is identical to before this prop existed. Ignored entirely when `audioUrl` is already set. */
  kokoroVoiceId?: string | null;
  /** Required alongside kokoroVoiceId — identifies which real sentence/word to resolve audio for server-side (see resolvePronunciationAudioAction's doc comment for why this is a content reference, never raw text). */
  contentType?: VoiceAudioContentType;
  contentId?: string;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const speech = useSpeech();
  const { t } = useLocale();
  const { speedMultiplier, registerReplay, getResolvedAudio, registerResolvedAudio, resolveAudio } =
    usePronunciationSettings();
  // Resolved once per resetKey and reused for both auto-play and every
  // subsequent replay click on the same sentence — a second resolution
  // call for content that's already resolved would just re-hit the same
  // cache row for no benefit.
  const [kokoroUrl, setKokoroUrl] = useState<string | null>(null);
  const [isResolvingKokoro, setIsResolvingKokoro] = useState(false);
  const resolvedForKeyRef = useRef<string | undefined>(undefined);
  const clip = useAudioClip(audioUrl ?? kokoroUrl);

  useEffect(() => {
    setKokoroUrl(null);
    resolvedForKeyRef.current = undefined;
  }, [resetKey]);

  // A pre-resolved audioUrl (page-load pre-resolution — see LessonPage) is
  // known the moment this mounts; feeding it into the shared cache too
  // means it's available under contentId for anything else that looks it
  // up this session, not just this one component instance.
  useEffect(() => {
    if (audioUrl && contentId) registerResolvedAudio(contentId, audioUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when this content's own audioUrl/contentId actually changes
  }, [audioUrl, contentId]);

  /**
   * Returns a playable URL. Priority: (1) a static recorded clip; (2) this
   * component instance's own already-resolved kokoroUrl; (3) the shared,
   * session-wide resolved-audio cache (see PronunciationSettingsProvider) —
   * a synchronous hit here means this exact sentence/word was already
   * resolved earlier in the session, whether by a previous visit,
   * prefetchPronunciation having warmed it in the background while the
   * learner was on the previous sentence, or the page's own server-side
   * pre-resolution; (4) only if all three miss, resolveAudio's actual
   * on-demand round trip — the SAME function prefetchPronunciation uses, so
   * if a background prefetch for this content is still in flight, this
   * joins that existing request instead of starting a second, duplicate
   * one, rather than a raw call to resolvePronunciationAudioAction here.
   * Its result is cached automatically for every future caller. Null means
   * "fall back to speech synthesis."
   */
  async function resolvePlaybackUrl(): Promise<string | null> {
    if (audioUrl) return audioUrl;
    // Guarded by resolvedForKeyRef (not just `if (kokoroUrl)`) to close a
    // real race: on a resetKey change, the reset effect below and the
    // autoPlay effect both fire in the same commit. The reset effect's
    // setKokoroUrl(null) is only *scheduled*, not yet applied, when the
    // autoPlay effect's closure reads `kokoroUrl` moments later in that same
    // flush — so without this guard, a fresh word/sentence's very first
    // auto-play could read and play the PREVIOUS word's still-stale kokoroUrl
    // state (confirmed live: Word Lists autoplay spoke the prior word, and
    // only a manual replay click — safely after the state had actually
    // settled — played the correct one). resolvedForKeyRef, in contrast, is a
    // ref: its reset to `undefined` on line below is synchronous and already
    // visible to this same-flush read, so comparing it against the current
    // resetKey reliably tells a genuinely-current kokoroUrl apart from a
    // stale one left over from the word/sentence this button just moved on
    // from.
    if (kokoroUrl && resolvedForKeyRef.current === resetKey) return kokoroUrl;
    if (!kokoroVoiceId || !contentType || !contentId) return null;

    const shared = getResolvedAudio(contentId);
    if (shared) {
      setKokoroUrl(shared);
      return shared;
    }

    if (resolvedForKeyRef.current === resetKey && !kokoroUrl) return null; // already tried and failed for this content — don't hammer the server on every replay click

    resolvedForKeyRef.current = resetKey;
    setIsResolvingKokoro(true);
    try {
      const url = await resolveAudio({ contentType, contentId, voiceId: kokoroVoiceId });
      if (url) setKokoroUrl(url);
      return url;
    } finally {
      setIsResolvingKokoro(false);
    }
  }

  async function playAuto() {
    const url = await resolvePlaybackUrl();
    if (url) {
      clip.play(url, speedMultiplier);
    } else {
      speech.speakSentence(text, speedMultiplier);
    }
    onPlay?.();
  }

  async function playReplay() {
    const url = await resolvePlaybackUrl();
    if (url) {
      clip.play(url, speedMultiplier);
    } else {
      speech.replaySentence(text, speedMultiplier);
    }
    onPlay?.();
  }

  // Keeps the global Shift shortcut (see PronunciationSettingsProvider)
  // replaying whichever sentence/word this button instance represents, at
  // whatever speed is currently selected — always reads the latest
  // playReplay via the ref rather than re-registering on every render, so
  // this effect only needs to run once per mount/unmount (each new
  // sentence/word is a fresh PronunciationButton instance — see the
  // `key={sentence.id}` / `key={word.id}` on their parents).
  const playReplayRef = useRef(playReplay);
  playReplayRef.current = playReplay;
  useEffect(() => {
    registerReplay(() => {
      void playReplayRef.current();
    });
    return () => registerReplay(null);
  }, [registerReplay]);

  // If the recorded/resolved clip fails, fall back to speech synthesis. Every click
  // starts a fresh Audio element (see useAudioClip), so status always
  // passes back through "loading" first — this fires again on every
  // subsequent replay attempt, not just the first, so a permanently broken
  // clip never leaves the learner without pronunciation.
  useEffect(() => {
    if (clip.status === "error") {
      speech.speakSentence(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the clip's own status changes
  }, [clip.status]);

  // Guards against React Strict Mode's dev-only double-invoke of effects
  // (mount → cleanup → mount again), which would otherwise call playAuto()
  // twice in a row for the same resetKey. Tracking the last-played key in a
  // ref — set synchronously, before speech even starts — means the second
  // invocation sees it's already played this key and no-ops, regardless of
  // how fast the two invocations fire.
  const lastPlayedKeyRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!autoPlay || resetKey === undefined) return;
    if (lastPlayedKeyRef.current === resetKey) return;
    // Neither a recorded clip nor a Kokoro voice depends on browser voices
    // at all — only the speech-synthesis fallback (no audioUrl AND no
    // kokoroVoiceId) needs to wait for the voice list to settle (see
    // useSpeech's voicesReady doc comment — speaking before Chrome has
    // resolved any voices is a known way for speak() to silently do
    // nothing). Gating on voicesReady even when Kokoro will actually serve
    // the audio was a real bug: it added up to ~1s of pure waiting (see
    // useSpeech's 1000ms fallback timer) before the cache/generation
    // pipeline even started, for content that was never going to touch
    // speech synthesis in the first place. This effect re-runs once
    // voicesReady flips true, so nothing is lost while waiting; the ref is
    // only set once playback actually starts, not while still waiting.
    if (!audioUrl && !kokoroVoiceId && !speech.voicesReady) return;
    lastPlayedKeyRef.current = resetKey;
    void playAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire exactly once per resetKey change (plus once more if voicesReady flips true mid-wait), not on every prop change
  }, [autoPlay, resetKey, audioUrl, kokoroVoiceId, speech.voicesReady]);

  const hasAudioSource = Boolean(audioUrl) || Boolean(kokoroVoiceId);
  const isSupported = hasAudioSource || speech.isSupported;
  if (!isSupported) return null;

  const isLoading = clip.status === "loading" || isResolvingKokoro;
  const isPlaying = clip.status === "playing" || speech.isSpeaking;

  function handleClick() {
    void playReplay();
    // Give the browser's own post-click focus handling a chance to land on
    // this button first, then take focus back — a same-tick refocus can
    // otherwise be clobbered by the click's default focus behavior.
    requestAnimationFrame(() => inputRef?.current?.focus());
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      // Only guards the new on-demand-generation path — a clip already
      // loading from a static audioUrl stays clickable exactly as before,
      // since that repeat-click behavior was never a problem this needed
      // to solve.
      disabled={isResolvingKokoro}
      aria-label={
        label ? undefined : isPlaying ? t.pronunciation.replayLabel : t.pronunciation.playLabel
      }
      className={cn(
        "text-muted-foreground shrink-0",
        isPlaying && "text-[var(--lesson-icon)]",
        className,
      )}
    >
      {isLoading ? (
        <Loader2
          className={cn(size === "icon" ? "size-5" : "size-4", !reducedMotion && "animate-spin")}
          aria-hidden="true"
        />
      ) : (
        <Volume2
          className={cn(
            size === "icon" ? "size-5" : "size-4",
            isPlaying && !reducedMotion && "animate-pulse",
          )}
          aria-hidden="true"
        />
      )}
      {label && <span>{label}</span>}
    </Button>
  );
}
