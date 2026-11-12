"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, RotateCcw } from "lucide-react";

import { COVER_ACCEPT, MAX_COVER_BYTES, MAX_COVER_LABEL, isCoverType } from "@/lib/word-covers";

const BUTTON =
  "pointer-events-auto flex size-[30px] items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none disabled:opacity-60";

/**
 * The admin's two buttons on a Word List's cover (the Word Lists library and the Words page's
 * topics, for an admin only): choose a picture from the computer, or take the chosen picture off
 * so the topic's drawing shows again. It sits over the cover, not inside the card's own button
 * (a button cannot hold a button), in a box the size of the cover that lets every click through
 * except on the buttons themselves. The buttons show on hover and keyboard focus, and always on a
 * screen with no hover.
 *
 * The upload goes to a route handler (src/app/api/admin/word-groups/[groupId]/cover/route.ts)
 * because a picture is bigger than a Server Action may carry; the page then reloads its own
 * server data, so the new cover shows at once.
 */
export function WordCoverEditor({ groupId, hasPicture }: { groupId: string; hasPicture: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A message goes away by itself.
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(null), 7000);
    return () => window.clearTimeout(timer);
  }, [error]);

  async function send(init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/word-groups/${encodeURIComponent(groupId)}/cover`, {
        ...init,
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Couldn't save the picture. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the site. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function onChoose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isCoverType(file.type)) {
      setError("Use a JPG, PNG, WebP or AVIF picture.");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setError(`That picture is too big. Use one under ${MAX_COVER_LABEL}.`);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    void send({ method: "POST", body: form });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/3] transition-transform duration-[250ms] motion-safe:group-hover:-translate-y-[3px]">
      <div className="absolute end-2.5 bottom-2.5 flex gap-1.5 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        {hasPicture && (
          <button
            type="button"
            className={BUTTON}
            disabled={busy}
            onClick={() => void send({ method: "DELETE" })}
            aria-label="Use the drawing again"
            title="Use the drawing again"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className={BUTTON}
          disabled={busy}
          onClick={() => input.current?.click()}
          aria-label="Change cover picture"
          title="Change cover picture"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept={COVER_ACCEPT}
        className="hidden"
        onChange={onChoose}
        tabIndex={-1}
        aria-hidden="true"
      />
      {error && (
        <p
          role="alert"
          dir="ltr"
          className="pointer-events-auto absolute inset-x-2.5 bottom-12 rounded-lg bg-black/80 px-2.5 py-1.5 text-xs leading-snug text-white"
        >
          {error}
        </p>
      )}
    </div>
  );
}
