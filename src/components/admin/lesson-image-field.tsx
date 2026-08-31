"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { removeLessonImage, uploadLessonImage } from "@/lib/admin/content-actions";
import type { LearningMode } from "@/types/content";

/**
 * Only meaningful once a lesson has a real id — Storage paths are keyed by
 * lesson id (see uploadLessonImage in content-actions.ts) — so this renders
 * a disabled, informational state on the "new lesson" form instead of a
 * live control. Runs its own useTransition, independent from the rest of
 * LessonForm's submit cycle, matching ArchiveButton's pattern: an image
 * change is saved immediately on upload/remove, not deferred to "Save
 * changes".
 */
export function LessonImageField({
  lessonId,
  mode,
  initialUrl,
}: {
  lessonId?: string;
  mode: LearningMode;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !lessonId) return;

    setError(null);
    setConfirmingRemove(false);
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadLessonImage(lessonId, mode, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) setUrl(result.url);
    });
  }

  function handleRemove() {
    if (!lessonId) return;
    setError(null);

    startTransition(async () => {
      const result = await removeLessonImage(lessonId, mode);
      if (result.error) {
        setError(result.error);
        return;
      }
      setUrl(null);
      setConfirmingRemove(false);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium">Illustration</span>
      <div className="flex items-center gap-4">
        <div className="border-border bg-muted relative flex aspect-[4/3] w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- small admin preview, not worth next/image's remote-loader ceremony here
            <img
              src={url}
              alt="Current lesson illustration"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground px-2 text-center text-xs">
              No image — using default scene
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {lessonId ? (
            confirmingRemove ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm">Remove this illustration?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-fit"
                    disabled={isPending}
                    onClick={handleRemove}
                  >
                    {isPending ? "Removing…" : "Remove"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={isPending}
                    onClick={() => setConfirmingRemove(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={isPending}
                    onClick={() => inputRef.current?.click()}
                  >
                    {isPending ? "Uploading…" : url ? "Replace image" : "Upload image"}
                  </Button>
                  {url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger w-fit"
                      disabled={isPending}
                      onClick={() => setConfirmingRemove(true)}
                      aria-label="Remove illustration"
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">JPG, PNG, or WebP, up to 5MB.</p>
              </>
            )
          ) : (
            <p className="text-muted-foreground text-xs">
              Save the lesson first, then come back to add an illustration.
            </p>
          )}
          {error && (
            <p role="alert" className="text-danger text-xs">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
