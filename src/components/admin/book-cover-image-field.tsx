"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { removeBookCoverImage, uploadBookCoverImage } from "@/lib/admin/library-actions";

/**
 * Only meaningful once a book has a real id — Storage paths are keyed by
 * book id (see uploadBookCoverImage in library-actions.ts) — so this renders
 * a disabled, informational state on the "new book" form instead of a live
 * control. Mirrors LessonImageField's pattern (its own useTransition,
 * independent from BookForm's submit cycle: a cover change is saved
 * immediately on upload/remove, not deferred to "Save changes").
 */
export function BookCoverImageField({
  bookId,
  initialUrl,
}: {
  bookId?: string;
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
    if (!file || !bookId) return;

    setError(null);
    setConfirmingRemove(false);
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadBookCoverImage(bookId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) setUrl(result.url);
    });
  }

  function handleRemove() {
    if (!bookId) return;
    setError(null);

    startTransition(async () => {
      const result = await removeBookCoverImage(bookId);
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
      <span className="text-sm font-medium">Cover image</span>
      <div className="flex items-center gap-4">
        <div className="border-border bg-muted relative flex aspect-[3/4] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- small admin preview, not worth next/image's remote-loader ceremony here
            <img src={url} alt="Current book cover" className="h-full w-full object-cover" />
          ) : (
            <span className="text-muted-foreground px-2 text-center text-xs">
              No image — using placeholder cover
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {bookId ? (
            confirmingRemove ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm">Remove this cover image?</p>
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
                      aria-label="Remove cover image"
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
              Save the book first, then come back to add a cover image.
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
