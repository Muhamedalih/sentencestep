"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applyOpeningLessonSentenceTranslations,
  applyOpeningLessonWordTranslations,
  generateOpeningLessonVoice,
  removeOnboardingCardImage,
  removeOpeningLessonImage,
  saveOnboardingCardTitle,
  saveOpeningLessonSentences,
  setOpeningLessonVoice,
  uploadOnboardingCardImage,
  uploadOpeningLessonImage,
} from "@/lib/admin/onboarding-card-actions";
import { ONBOARDING_CARD_TITLE_MAX_LENGTH } from "@/lib/admin/onboarding-card-settings";
import type { OnboardingCardSettings } from "@/lib/admin/onboarding-card-settings";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { cn } from "@/lib/utils";

export function OnboardingCardSettingsForm({
  initial,
  initialLessonImageUrl,
  initialLessonVoiceId,
  voices,
  initialSentences,
}: {
  initial: OnboardingCardSettings;
  initialLessonImageUrl: string | null;
  initialLessonVoiceId: string | null;
  voices: VoiceRow[];
  initialSentences: { en: string; ar: string }[];
}) {
  const [sentences, setSentences] = useState(initialSentences);
  const [sentencesMessage, setSentencesMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [isSavingSentences, startSavingSentences] = useTransition();

  function updateSentence(index: number, field: "en" | "ar", value: string) {
    setSentences((prev) =>
      prev.map((sentence, i) => (i === index ? { ...sentence, [field]: value } : sentence)),
    );
  }

  function handleSaveSentences() {
    setSentencesMessage(null);
    startSavingSentences(async () => {
      const result = await saveOpeningLessonSentences(sentences);
      if (result.error) {
        setSentencesMessage({ kind: "error", text: result.error });
        return;
      }
      setSentencesMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  const [sentenceTranslationsMessage, setSentenceTranslationsMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [isApplyingSentenceTranslations, startApplyingSentenceTranslations] = useTransition();

  function handleApplySentenceTranslations() {
    setSentenceTranslationsMessage(null);
    startApplyingSentenceTranslations(async () => {
      const result = await applyOpeningLessonSentenceTranslations();
      if (result.error) {
        setSentenceTranslationsMessage({ kind: "error", text: result.error });
        return;
      }
      setSentenceTranslationsMessage({ kind: "success", text: result.success ?? "Applied." });
    });
  }
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

  const [lessonImageUrl, setLessonImageUrl] = useState(initialLessonImageUrl);
  const [confirmingLessonImageRemove, setConfirmingLessonImageRemove] = useState(false);
  const [lessonImageError, setLessonImageError] = useState<string | null>(null);
  const [isPendingLessonImage, startLessonImageTransition] = useTransition();
  const lessonImageInputRef = useRef<HTMLInputElement>(null);

  function handleLessonImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLessonImageError(null);
    setConfirmingLessonImageRemove(false);
    const formData = new FormData();
    formData.set("file", file);

    startLessonImageTransition(async () => {
      const result = await uploadOpeningLessonImage(formData);
      if (result.error) {
        setLessonImageError(result.error);
        return;
      }
      if (result.url) setLessonImageUrl(result.url);
    });
  }

  function handleLessonImageRemove() {
    setLessonImageError(null);
    startLessonImageTransition(async () => {
      const result = await removeOpeningLessonImage();
      if (result.error) {
        setLessonImageError(result.error);
        return;
      }
      setLessonImageUrl(null);
      setConfirmingLessonImageRemove(false);
    });
  }

  const [voiceId, setVoiceId] = useState(initialLessonVoiceId ?? "");
  const [voiceMessage, setVoiceMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [isSavingVoice, startSavingVoice] = useTransition();
  const [isGeneratingVoice, startGeneratingVoice] = useTransition();

  function handleSaveVoice() {
    setVoiceMessage(null);
    startSavingVoice(async () => {
      const result = await setOpeningLessonVoice(voiceId || null);
      if (result.error) {
        setVoiceMessage({ kind: "error", text: result.error });
        return;
      }
      setVoiceMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  function handleGenerateVoice() {
    setVoiceMessage(null);
    startGeneratingVoice(async () => {
      const result = await generateOpeningLessonVoice();
      if (result.error) {
        setVoiceMessage({ kind: "error", text: result.error });
        return;
      }
      setVoiceMessage({ kind: "success", text: result.success ?? "Generated." });
    });
  }

  const [wordTranslationsMessage, setWordTranslationsMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [isApplyingWordTranslations, startApplyingWordTranslations] = useTransition();

  function handleApplyWordTranslations() {
    setWordTranslationsMessage(null);
    startApplyingWordTranslations(async () => {
      const result = await applyOpeningLessonWordTranslations();
      if (result.error) {
        setWordTranslationsMessage({ kind: "error", text: result.error });
        return;
      }
      setWordTranslationsMessage({ kind: "success", text: result.success ?? "Applied." });
    });
  }

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
          <CardTitle className="text-lg">Sentences</CardTitle>
          <CardDescription>
            The 5 sentences of the opening lesson itself — shared by all three starting levels
            (beginner, intermediate, advanced). Saving here updates all three at once; existing
            Spanish/Turkish drafts are marked stale so they get refreshed to match.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sentences.map((sentence, index) => (
            <div key={index} className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">English {index + 1}</span>
                <input
                  type="text"
                  value={sentence.en}
                  onChange={(event) => updateSentence(index, "en", event.target.value)}
                  dir="ltr"
                  className="border-input bg-background rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">Arabic {index + 1}</span>
                <input
                  type="text"
                  value={sentence.ar}
                  onChange={(event) => updateSentence(index, "ar", event.target.value)}
                  dir="rtl"
                  className="border-input bg-background rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSaveSentences} disabled={isSavingSentences}>
              {isSavingSentences ? "Saving…" : "Save sentences"}
            </Button>
            {sentencesMessage && (
              <p
                role={sentencesMessage.kind === "error" ? "alert" : undefined}
                className={cn(
                  "text-sm",
                  sentencesMessage.kind === "error" ? "text-danger" : "text-muted-foreground",
                )}
              >
                {sentencesMessage.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
          <CardTitle className="text-lg">Lesson illustration</CardTitle>
          <CardDescription>
            The picture shown beside the sentence on the opening lesson itself, for all three
            starting levels (beginner, intermediate, advanced) at once — not the cover image above.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="border-border bg-muted relative flex aspect-[4/3] w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
            {lessonImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- small admin preview, not worth next/image's remote-loader ceremony here
              <img
                src={lessonImageUrl}
                alt="Current opening lesson illustration"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground px-2 text-center text-xs">
                No image — using default scene
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {confirmingLessonImageRemove ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm">Remove this image?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-fit"
                    disabled={isPendingLessonImage}
                    onClick={handleLessonImageRemove}
                  >
                    {isPendingLessonImage ? "Removing…" : "Remove"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={isPendingLessonImage}
                    onClick={() => setConfirmingLessonImageRemove(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={lessonImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLessonImageFileChange}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={isPendingLessonImage}
                    onClick={() => lessonImageInputRef.current?.click()}
                  >
                    {isPendingLessonImage
                      ? "Uploading…"
                      : lessonImageUrl
                        ? "Replace image"
                        : "Upload image"}
                  </Button>
                  {lessonImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger w-fit"
                      disabled={isPendingLessonImage}
                      onClick={() => setConfirmingLessonImageRemove(true)}
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
            {lessonImageError && (
              <p role="alert" className="text-danger text-xs">
                {lessonImageError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Narration voice</CardTitle>
          <CardDescription>
            The voice heard on the opening lesson itself, for all three starting levels at once.
            Picking a voice doesn&apos;t regenerate existing audio by itself — use &quot;Generate
            audio&quot; below after changing it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <select
            value={voiceId}
            onChange={(event) => setVoiceId(event.target.value)}
            className="border-input bg-background h-11 rounded-lg border px-3 text-sm"
          >
            <option value="">Use default voice</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} — {voice.gender === "female" ? "Female" : "Male"} / {voice.accent}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSaveVoice} disabled={isSavingVoice}>
              {isSavingVoice ? "Saving…" : "Save voice"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateVoice}
              disabled={isGeneratingVoice}
            >
              {isGeneratingVoice ? "Generating…" : "Generate audio"}
            </Button>
            {voiceMessage && (
              <p
                role={voiceMessage.kind === "error" ? "alert" : undefined}
                className={cn(
                  "text-sm",
                  voiceMessage.kind === "error" ? "text-danger" : "text-muted-foreground",
                )}
              >
                {voiceMessage.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Word-by-word translations</CardTitle>
          <CardDescription>
            The per-word Arabic gloss a learner sees under the word they&apos;re currently typing.
            Applies the hand-authored word list for all 5 opening-lesson sentences to all three
            starting levels at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyWordTranslations}
            disabled={isApplyingWordTranslations}
          >
            {isApplyingWordTranslations ? "Applying…" : "Apply word-by-word translations"}
          </Button>
          {wordTranslationsMessage && (
            <p
              role={wordTranslationsMessage.kind === "error" ? "alert" : undefined}
              className={cn(
                "text-sm",
                wordTranslationsMessage.kind === "error" ? "text-danger" : "text-muted-foreground",
              )}
            >
              {wordTranslationsMessage.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spanish &amp; Turkish translations</CardTitle>
          <CardDescription>
            Translates the 5 opening-lesson sentences into Spanish and Turkish (the title and
            description already have theirs). Applies the hand-authored translations to all three
            starting levels at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleApplySentenceTranslations}
            disabled={isApplyingSentenceTranslations}
          >
            {isApplyingSentenceTranslations ? "Applying…" : "Apply Spanish & Turkish translations"}
          </Button>
          {sentenceTranslationsMessage && (
            <p
              role={sentenceTranslationsMessage.kind === "error" ? "alert" : undefined}
              className={cn(
                "text-sm",
                sentenceTranslationsMessage.kind === "error"
                  ? "text-danger"
                  : "text-muted-foreground",
              )}
            >
              {sentenceTranslationsMessage.text}
            </p>
          )}
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
