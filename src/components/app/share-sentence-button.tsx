"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { SavedSentenceItem } from "@/lib/supabase/queries/saved-sentences";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

/** Same per-book hue hash BookCard uses for its cover-less gradient placeholder — reused here so a shared quote card and that book's own tile in the Library read as the same visual family. */
function stableHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Renders one saved sentence as a portrait quote card (English + translation,
 * the book it came from, a small brand mark) and hands it off via the Web
 * Share sheet where available, falling back to a plain PNG download —
 * turning a private save into something worth sending to someone else,
 * which a flat bookmarks list gives no reason to ever revisit for. Rendered
 * as one half of SavedSentenceCard's split footer pill (see that
 * component), matching Practice's own weight rather than a bare icon.
 */
export function ShareSentenceButton({ item }: { item: SavedSentenceItem }) {
  const { t } = useLocale();
  const [justShared, setJustShared] = useState(false);

  async function handleShare() {
    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hue = stableHue(item.bookId);
    const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
    gradient.addColorStop(0, `hsl(${hue}, 40%, 22%)`);
    gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 35%, 10%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // A faint oversized quotation mark for texture, same "designed
    // placeholder" idea as BookCard's giant faint initial letter.
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "700 420px Georgia, serif";
    ctx.textBaseline = "top";
    ctx.fillText("“", 40, -70);

    const padding = 100;
    const maxWidth = CARD_WIDTH - padding * 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 64px system-ui, sans-serif";
    const enLines = wrapLines(ctx, item.en, maxWidth);

    let translationLines: string[] = [];
    if (item.supportText) {
      ctx.font = "400 40px system-ui, sans-serif";
      translationLines = wrapLines(ctx, item.supportText, maxWidth);
    }

    const enLineHeight = 84;
    const trLineHeight = 58;
    const blockHeight =
      enLines.length * enLineHeight +
      (translationLines.length > 0 ? 36 + translationLines.length * trLineHeight : 0);
    let y = CARD_HEIGHT / 2 - blockHeight / 2 + enLineHeight / 2;

    ctx.font = "600 64px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    for (const line of enLines) {
      ctx.fillText(line, CARD_WIDTH / 2, y);
      y += enLineHeight;
    }

    if (translationLines.length > 0) {
      y += 36 - enLineHeight / 2 + trLineHeight / 2;
      ctx.font = "400 40px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      for (const line of translationLines) {
        ctx.fillText(line, CARD_WIDTH / 2, y);
        y += trLineHeight;
      }
    }

    ctx.font = "500 28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(item.bookTitle, CARD_WIDTH / 2, CARD_HEIGHT - 150);

    ctx.font = "700 30px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("SentenceStep", CARD_WIDTH / 2, CARD_HEIGHT - 90);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;

    const file = new File([blob], `sentencestep-quote-${item.sentenceId}.png`, {
      type: "image/png",
    });

    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
      share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
    };

    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: item.en, text: item.supportText });
        setJustShared(true);
        setTimeout(() => setJustShared(false), 1500);
        return;
      } catch {
        // Cancelled or unsupported mid-flight — fall through to a plain download.
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    setJustShared(true);
    setTimeout(() => setJustShared(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={t.bookLibrary.shareSentence}
      title={t.bookLibrary.shareSentence}
      className="text-muted-foreground hover:text-foreground flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-transform duration-200 ease-out hover:scale-[1.05] active:scale-[0.97]"
    >
      {justShared ? (
        <Check className="text-success size-3.5" aria-hidden="true" />
      ) : (
        <Share2 className="size-3.5" aria-hidden="true" />
      )}
      {t.bookLibrary.share}
    </button>
  );
}
