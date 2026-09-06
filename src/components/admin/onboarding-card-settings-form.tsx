"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  removeOnboardingCardImage,
  saveOnboardingCardTitle,
  uploadOnboardingCardImage,
} from "@/lib/admin/onboarding-card-actions";
import { ONBOARDING_CARD_TITLE_MAX_LENGTH } from "@/lib/admin/onboarding-card-settings";
import type { OnboardingCardSettings } from "@/lib/admin/onboarding-card-settings";
import { cn } from "@/lib/utils";

export function OnboardingCardSettingsForm({ initial }: { initial: OnboardingCardSettings }) {
  const [title, setTitle] = useState(initial.title);
  const [url, setUrl] = useState(initial.imageUrl);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [titleMessage, setTitleMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSavingTitle, startSavingTitle] = useTransition();
  const [isPendingImage, startImageTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSaveTitle() {
    setTitleMessage(null);
    startSavingTitle(async () => {
      const result = await saveOnboardingCardTitle(title);
      if (result.error) {
        setTitleMessage({ kind: "error", text: result.error });
        return;
      }
      setTitleMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageError(null);
    setConfirmingRemove(false);
    const formData = new FormData();
    formData.set("file", file);

    startImageTransition(async () => {
      const result = await uploadOnboardingCardImage(formData);
      if (result.error) {
        setImageError(result.error);
        return;
      }
      if (result.url) setUrl(result.url);
    });
  }

  function handleRemove() {
    setImageError(null);
    startImageTransition(async () => {
      const result = await removeOnboardingCardImage();
      if (result.error) {
        setImageError(result.error);
        return;
      }
      setUrl(null);
      setConfirmingRemove(false);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cover image</CardTitle>
          <CardDescription>
            Shown behind the headline below. Without one, learners see a plain icon instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="border-border bg-muted relative flex aspect-[4/3] w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element -- small admin preview, not worth next/image's remote-loader ceremony here
              <img
                src={url}
                alt="Current onboarding card image"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground px-2 text-center text-xs">
                No image — using default icon
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {confirmingRemove ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm">Remove this image?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-fit"
                    disabled={isPendingImage}
                    onClick={handleRemove}
                  >
                    {isPendingImage ? "Removing…" : "Remove"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={isPendingImage}
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
                    disabled={isPendingImage}
                    onClick={() => inputRef.current?.click()}
                  >
                    {isPendingImage ? "Uploading…" : url ? "Replace image" : "Upload image"}
                  </Button>
                  {url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger w-fit"
                      disabled={isPendingImage}
                      onClick={() => setConfirmingRemove(true)}
                      aria-label="Remove image"
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">JPG, PNG, or WebP, up to 5MB.</p>
              </>
            )}
            {imageError && (
              <p role="alert" className="text-danger text-xs">
                {imageError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Headline</CardTitle>
          <CardDescription>The one line of text shown under the image.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={ONBOARDING_CARD_TITLE_MAX_LENGTH}
            dir="ltr"
            className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Your English Journey Starts Here"
          />
          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSaveTitle} disabled={isSavingTitle}>
              {isSavingTitle ? "Saving…" : "Save headline"}
            </Button>
            {titleMessage && (
              <p
                role={titleMessage.kind === "error" ? "alert" : undefined}
                className={cn(
                  "text-sm",
                  titleMessage.kind === "error" ? "text-danger" : "text-muted-foreground",
                )}
              >
                {titleMessage.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
