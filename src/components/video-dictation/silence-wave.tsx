"use client";

import { useEffect, useRef } from "react";

import { waveLevel } from "@/lib/video-dictation/segments";

const BARS = 37;
const BAR_WIDTH = 3;
const BAR_GAP = 6;
const HEIGHT = 64;

/**
 * The quiet wave that stands in for the sentence while the speakers are silent: thin rounded bars, tallest
 * in the middle, each breathing at its own pace. The video's sound cannot be read from YouTube's player, so
 * the height is drawn from how close the speech is (`secondsToSpeech`, read every frame) plus a gentle wobble.
 * With reduced motion it is one still, low wave.
 */
export function SilenceWave({
  secondsToSpeech,
  reducedMotion,
}: {
  /** Read on every frame: the distance in seconds from the playhead to the sentence's first word. */
  secondsToSpeech: () => number;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const width = BARS * BAR_WIDTH + (BARS - 1) * BAR_GAP;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(HEIGHT * ratio);
    context.scale(ratio, ratio);
    const color = getComputedStyle(canvas).color;

    let frame = 0;
    let smooth = waveLevel(Infinity);
    const draw = (now: number) => {
      const target = reducedMotion ? 0.28 : waveLevel(secondsToSpeech());
      smooth += (target - smooth) * 0.08;
      context.clearRect(0, 0, width, HEIGHT);
      context.fillStyle = color;
      for (let i = 0; i < BARS; i += 1) {
        const x = i * (BAR_WIDTH + BAR_GAP);
        const centre = 1 - Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2);
        const shape = 0.18 + 0.82 * Math.pow(centre, 1.6);
        const wobble = reducedMotion
          ? 0.5
          : 0.5 + 0.3 * Math.sin(now / 520 + i * 0.7) + 0.2 * Math.sin(now / 1130 + i * 1.9);
        const h = Math.max(4, HEIGHT * shape * (0.25 + 0.75 * wobble) * smooth * 1.15);
        context.globalAlpha = 0.35 + 0.55 * Math.min(1, h / HEIGHT + 0.15);
        context.beginPath();
        context.roundRect(x, (HEIGHT - h) / 2, BAR_WIDTH, h, BAR_WIDTH / 2);
        context.fill();
      }
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, secondsToSpeech]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="text-primary"
      style={{
        width: BARS * BAR_WIDTH + (BARS - 1) * BAR_GAP,
        height: HEIGHT,
        maxWidth: "100%",
      }}
    />
  );
}
