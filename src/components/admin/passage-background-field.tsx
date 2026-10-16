"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { PosterPicture } from "@/components/passages/poster-picture";
import { Button } from "@/components/ui/button";
import { posterArtFor } from "@/lib/passages/art";
import {
  BACKGROUND_ACCEPT,
  MAX_BACKGROUND_BYTES,
  MAX_BACKGROUND_LABEL,
  MIN_BACKGROUND_SIDE,
  isBackgroundType,
} from "@/lib/passages/background";
import type { PassageTone } from "@/lib/passages/types";

/**
 * Choosing and removing the picture that is a passage's background. The upload goes to a
 * route handler, not a Server Action: a picture is bigger than a Server Action may carry
 * (see src/app/api/admin/passages/[passageId]/background/route.ts). The page is refreshed
 * once the server has saved it, so what is shown is always what is stored.
 */
function useBackgroundPicture(passageId: string) {
  const router = useRouter();
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(method: "POST" | "DELETE", body?: FormData) {
    setBusy(method === "POST" ? "upload" : "remove");
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/passages/${encodeURIComponent(passageId)}/background`,
        { method, body },
      );
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error ?? "Couldn't save the picture. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  function upload(file: File) {
    if (!isBackgroundType(file.type)) {
      setError("Use a JPG, PNG, WebP or AVIF picture.");
      return;
    }
    if (file.size > MAX_BACKGROUND_BYTES) {
      setError(`That picture is too big. Use one under ${MAX_BACKGROUND_LABEL}.`);
      return;
    }
    const form = new FormData();
    form.set("file", file);
    void send("POST", form);
  }

  return { busy, error, upload, remove: () => void send("DELETE") };
}

/** A hidden file input and the function that opens it; the chosen file goes straight to `onPick`. */
function useFilePicker(onPick: (file: File) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={BACKGROUND_ACCEPT}
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        // Cleared so choosing the same file again still counts as a choice.
        event.target.value = "";
        if (file) onPick(file);
      }}
    />
  );
  return { input, open: () => inputRef.current?.click() };
}

/** The big control on a passage's own page: the poster as learners will see it, and the buttons. */
export function PassageBackgroundField({
  passageId,
  title,
  order,
  tone,
  posterUrl,
}: {
  passageId: string;
  title: string;
  order: number;
  tone: PassageTone;
  posterUrl: string | null;
}) {
  const { busy, error, upload, remove } = useBackgroundPicture(passageId);
  const picker = useFilePicker(upload);
  const [confirming, setConfirming] = useState(false);
  const art = posterArtFor(tone, order);

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div
        className="relative aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/10 dark:ring-white/10"
        style={{ backgroundImage: art.backgroundImage }}
      >
        <PosterPicture src={posterUrl} />
        <span className="absolute start-3 top-3 text-xs font-medium text-white/60 tabular-nums">
          {String(order).padStart(2, "0")}
        </span>
        <span
          className="absolute inset-x-3 bottom-3 text-[0.95rem] leading-tight font-semibold text-balance text-white"
          dir="ltr"
        >
          {title}
        </span>
        {busy === "upload" && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45">
            <Loader2 className="size-6 animate-spin text-white" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-3">
        {picker.input}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled={busy !== null} onClick={picker.open}>
            {busy === "upload" ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus aria-hidden="true" />
            )}
            {busy === "upload" ? "Uploading…" : posterUrl ? "Replace picture" : "Choose a picture"}
          </Button>
          {posterUrl &&
            (confirming ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy !== null}
                  onClick={() => {
                    setConfirming(false);
                    remove();
                  }}
                >
                  {busy === "remove" ? "Removing…" : "Yes, remove it"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-danger"
                disabled={busy !== null}
                onClick={() => setConfirming(true)}
              >
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
            ))}
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          JPG, PNG, WebP or AVIF · at least {MIN_BACKGROUND_SIDE} px on each side (1200 px wide or
          more looks best) · up to {MAX_BACKGROUND_LABEL}. The picture is resized and cropped for
          you; the poster shows its most interesting part.
        </p>
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/** The small control in the Passages table: the poster in miniature, and a click chooses (or replaces) its picture. */
export function PassageBackgroundThumb({
  passageId,
  title,
  order,
  tone,
  posterUrl,
}: {
  passageId: string;
  title: string;
  order: number;
  tone: PassageTone;
  posterUrl: string | null;
}) {
  const { busy, error, upload } = useBackgroundPicture(passageId);
  const picker = useFilePicker(upload);
  const art = posterArtFor(tone, order);
  const action = posterUrl ? "Replace" : "Choose";

  return (
    <div className="flex flex-col gap-1">
      {picker.input}
      <button
        type="button"
        disabled={busy !== null}
        onClick={picker.open}
        title={`${action} the background picture`}
        aria-label={`${action} the background picture of ${title}`}
        className="group focus-visible:ring-primary relative block aspect-[3/4] w-10 overflow-hidden rounded-md ring-1 ring-black/10 outline-none focus-visible:ring-2 disabled:cursor-wait dark:ring-white/10"
        style={{ backgroundImage: art.backgroundImage }}
      >
        <PosterPicture src={posterUrl} />
        <span
          className={`absolute inset-0 flex items-center justify-center text-white transition-opacity ${
            busy === "upload"
              ? "bg-black/45 opacity-100"
              : posterUrl
                ? "bg-black/45 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                : "opacity-80 group-hover:opacity-100"
          }`}
        >
          {busy === "upload" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-4" aria-hidden="true" />
          )}
        </span>
      </button>
      {error && (
        <p role="alert" className="text-danger w-40 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
