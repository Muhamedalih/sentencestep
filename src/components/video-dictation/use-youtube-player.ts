"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { describePlayerError, loadYouTubeApi, type YTPlayer } from "./youtube-api";

export type PlayerFailure = "blocked" | "unavailable" | "other";

export interface PlayerControls {
  getTime: () => number;
  getDuration: () => number;
  getState: () => number;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setRate: (rate: number) => void;
}

interface Options {
  /** Null while there is no video to play yet (the admin tool before a link is loaded). */
  youtubeId: string | null;
  /** Where the video starts when it is first played (the clip's start). */
  startSeconds: number;
  /** Called with YouTube's own state number (see PLAYER_STATE) on every change. */
  onState: (state: number) => void;
}

/**
 * Puts YouTube's official player into the element `hostRef` points at. The player is YouTube's own
 * (its title, its channel and its controls stay as they are); the page only plays, pauses, seeks and
 * changes the speed through the documented calls. The privacy-enhanced host (youtube-nocookie.com)
 * is used so nothing is stored in the viewer's browser before they press play.
 */
export function useYouTubePlayer({ youtubeId, startSeconds, onState }: Options): {
  hostRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
  failure: PlayerFailure | null;
  controls: PlayerControls;
} {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<PlayerFailure | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !youtubeId) return;
    let cancelled = false;
    let player: YTPlayer | null = null;

    loadYouTubeApi()
      .then((yt) => {
        if (cancelled) return;
        const mount = document.createElement("div");
        host.appendChild(mount);
        player = new yt.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          videoId: youtubeId,
          playerVars: {
            playsinline: 1,
            rel: 0,
            disablekb: 1,
            iv_load_policy: 3,
            fs: 0,
            start: Math.floor(startSeconds),
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              playerRef.current = player;
              setReady(true);
            },
            onStateChange: (event) => onStateRef.current(event.data),
            onError: (event) => {
              if (!cancelled) setFailure(describePlayerError(event.data));
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailure("blocked");
      });

    return () => {
      cancelled = true;
      playerRef.current = null;
      try {
        player?.destroy();
      } catch {
        // The iframe is already gone: nothing left to clean up.
      }
      host.replaceChildren();
    };
  }, [youtubeId, startSeconds]);

  const controls = useMemo<PlayerControls>(() => {
    const read = (fallback: number, call: (player: YTPlayer) => number): number => {
      try {
        const player = playerRef.current;
        return player ? call(player) : fallback;
      } catch {
        return fallback;
      }
    };
    const act = (call: (player: YTPlayer) => void) => {
      try {
        const player = playerRef.current;
        if (player) call(player);
      } catch {
        // A call made while the player is being replaced does nothing.
      }
    };
    return {
      getTime: () => read(0, (player) => player.getCurrentTime()),
      getDuration: () => read(0, (player) => player.getDuration()),
      getState: () => read(-1, (player) => player.getPlayerState()),
      play: () => act((player) => player.playVideo()),
      pause: () => act((player) => player.pauseVideo()),
      seekTo: (seconds) => act((player) => player.seekTo(seconds, true)),
      setRate: (rate) => act((player) => player.setPlaybackRate(rate)),
    };
  }, []);

  return { hostRef, ready, failure, controls };
}
