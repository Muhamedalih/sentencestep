"use client";

import { Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

/**
 * Plays a sentence aloud via useSpeech. Renders nothing if the browser has
 * no speech synthesis support, so it never leaves a dead control on screen.
 */
export function PronunciationButton({ text, className }: { text: string; className?: string }) {
  const { speak, isSpeaking, isSupported } = useSpeech();

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => speak(text)}
      aria-label="Play pronunciation"
      className={cn("text-muted-foreground shrink-0", isSpeaking && "text-primary", className)}
    >
      <Volume2 className={cn("size-5", isSpeaking && "animate-pulse")} aria-hidden="true" />
    </Button>
  );
}
