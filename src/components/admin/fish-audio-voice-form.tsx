"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Play, Search, Sparkles, Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addFishAudioVoiceAction,
  browseFishAudioVoicesAction,
  fetchFishAudioSampleAction,
  previewFishAudioAction,
} from "@/lib/admin/fish-audio-actions";
import { deleteVoiceAction } from "@/lib/admin/voices-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { dataUriToBlobUrl } from "@/lib/audio-preview";
import {
  fishVoiceAccent,
  type FishAudioSort,
  type FishAudioVoiceSummary,
} from "@/lib/voice/providers/fish-audio";
import { cn } from "@/lib/utils";

/** The tags Fish's library actually uses for voice character — one click narrows the suggestions (all selected tags must match). */
const FILTER_TAGS = [
  "female",
  "male",
  "narration",
  "educational",
  "conversational",
  "clear",
  "calm",
  "friendly",
  "professional",
];

const SORT_OPTIONS: { value: FishAudioSort; label: string }[] = [
  { value: "score", label: "Recommended" },
  { value: "task_count", label: "Most used" },
  { value: "created_at", label: "Newest" },
];

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

type Message = { kind: "success" | "error"; text: string };

/**
 * Fish Audio voices for Word Lists — the Fish counterpart of
 * CartesiaVoiceForm: browse the public library (starting from Fish's own
 * "recommended" order), hear a voice's sample before adding it, add it, or
 * paste a voice id directly. Registered voices can then be picked per word
 * group (Edit word group → Narration voice) or as the site default.
 *
 * Everything runs on Fish's free `s2.1-pro-free` model — see
 * content-provider-map.ts's FISH_AUDIO_MODEL for its terms.
 */
export function FishAudioVoiceForm({ voices }: { voices: VoiceRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<FishAudioSort>("score");
  // Fish's own "recommended" order leads with game/character announcers, so the
  // suggestions start narrowed to its "educational" voices — one click on the
  // chip widens them back to everything.
  const [tags, setTags] = useState<string[]>(["educational"]);
  const [results, setResults] = useState<FishAudioVoiceSummary[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function report(result: { error?: string; success?: string }, fallback: string) {
    setMessage(
      result.error
        ? { kind: "error", text: result.error }
        : { kind: "success", text: result.success ?? fallback },
    );
  }

  function playDataUri(dataUri: string) {
    // Blob URL, not the raw data: URI — same reason as CartesiaVoiceForm
    // (see dataUriToBlobUrl's doc comment).
    const blobUrl = dataUriToBlobUrl(dataUri);
    // The player below is keyed on this URL and set to autoPlay; if the
    // browser blocks autoplay (the click's gesture window has passed by the
    // time the server round trip finishes) its own controls are the fallback.
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return blobUrl;
    });
  }

  function browse(
    nextPage: number,
    append: boolean,
    overrides?: { tags?: string[]; sort?: FishAudioSort },
  ) {
    setMessage(null);
    startTransition(async () => {
      const result = await browseFishAudioVoicesAction({
        query,
        tags: overrides?.tags ?? tags,
        sort: overrides?.sort ?? sort,
        page: nextPage,
      });
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        if (!append) setResults(null);
        return;
      }
      setResults((prev) =>
        append ? [...(prev ?? []), ...(result.voices ?? [])] : (result.voices ?? []),
      );
      setPage(nextPage);
      setHasMore(result.hasMore === true);
    });
  }

  function toggleTag(tag: string) {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    setTags(next);
    // Re-run straight away once the list is open, so a chip feels like a filter.
    if (results) browse(1, false, { tags: next });
  }

  function handleSample(voice: FishAudioVoiceSummary) {
    if (!voice.sampleAudioUrl) return;
    setMessage(null);
    setBusyId(`sample:${voice.id}`);
    startTransition(async () => {
      const result = await fetchFishAudioSampleAction(voice.sampleAudioUrl as string);
      setBusyId(null);
      if (result.error || !result.audioDataUri) {
        setMessage({ kind: "error", text: result.error ?? "Couldn't play the sample." });
        return;
      }
      playDataUri(result.audioDataUri);
    });
  }

  function handleAddFromCatalog(voice: FishAudioVoiceSummary) {
    setMessage(null);
    setBusyId(`add:${voice.id}`);
    startTransition(async () => {
      const result = await addFishAudioVoiceAction({
        name: voice.name,
        providerVoiceId: voice.id,
        gender: voice.gender ?? "female",
        accent: fishVoiceAccent(voice.tags),
        description: voice.description,
      });
      setBusyId(null);
      report(result, "Added.");
    });
  }

  function handleAddManual(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await addFishAudioVoiceAction({
        name: String(formData.get("name") ?? ""),
        providerVoiceId: String(formData.get("providerVoiceId") ?? ""),
        gender: formData.get("gender") === "male" ? "male" : "female",
        accent: String(formData.get("accent") ?? ""),
      });
      report(result, "Added.");
      if (!result.error) formRef.current?.reset();
    });
  }

  function handlePreview(voice: VoiceRow) {
    setMessage(null);
    setBusyId(`preview:${voice.id}`);
    startTransition(async () => {
      const result = await previewFishAudioAction({ providerVoiceId: voice.providerVoiceId });
      setBusyId(null);
      if (result.error || !result.audioDataUri) {
        setMessage({ kind: "error", text: result.error ?? "Preview failed." });
        return;
      }
      playDataUri(result.audioDataUri);
    });
  }

  function handleDelete(voiceId: string) {
    setMessage(null);
    startTransition(async () => {
      report(await deleteVoiceAction(voiceId), "Deleted.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fish Audio voices</CardTitle>
        <CardDescription>
          Free voices for Word Lists (Fish Audio&apos;s free model). Browse Fish&apos;s library —
          starting from the voices it recommends — hear a sample, and add the ones you like. Then
          pick one per word group (Word Lists → Edit group → Narration voice) or set it as the Word
          Lists default above.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  browse(1, false);
                }
              }}
              placeholder="Search Fish voices by name (e.g. Sarah, narrator, teacher)"
              className="border-input bg-background min-w-56 flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <select
              value={sort}
              onChange={(e) => {
                const next = e.target.value as FishAudioSort;
                setSort(next);
                if (results) browse(1, false, { sort: next });
              }}
              aria-label="Sort voices"
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button type="button" disabled={isPending} onClick={() => browse(1, false)}>
              {results ? <Search className="size-4" /> : <Sparkles className="size-4" />}
              {results ? "Search" : "Show suggested voices"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  disabled={isPending}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-muted",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {results && (
            <div className="flex flex-col gap-1.5 rounded-lg border p-2">
              {results.length === 0 && (
                <p className="text-muted-foreground py-2 text-center text-sm">No voices found.</p>
              )}
              {results.map((voice) => {
                const alreadyAdded = voices.some((v) => v.providerVoiceId === voice.id);
                return (
                  <div
                    key={voice.id}
                    className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium">{voice.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {compact.format(voice.usageCount)} uses ·{" "}
                          {compact.format(voice.likeCount)} likes
                          {voice.author ? ` · by ${voice.author}` : ""}
                        </span>
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {voice.tags.slice(0, 6).join(" · ")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Play sample of ${voice.name}`}
                      disabled={isPending || !voice.sampleAudioUrl}
                      onClick={() => handleSample(voice)}
                    >
                      {busyId === `sample:${voice.id}` ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isPending || alreadyAdded}
                      onClick={() => handleAddFromCatalog(voice)}
                    >
                      {busyId === `add:${voice.id}` ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : alreadyAdded ? (
                        "Added"
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                );
              })}
              {hasMore && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => browse(page + 1, true)}
                >
                  Load more
                </Button>
              )}
            </div>
          )}
        </div>

        <form ref={formRef} action={handleAddManual} className="grid gap-3 sm:grid-cols-4">
          <input
            name="name"
            placeholder="Display name (e.g. Calm Teacher)"
            required
            className="border-input bg-background rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="providerVoiceId"
            placeholder="Fish voice id (from the voice's fish.audio page)"
            required
            className="border-input bg-background rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            name="gender"
            defaultValue="female"
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <input
            name="accent"
            placeholder="Accent (e.g. American)"
            className="border-input bg-background rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <Button type="submit" disabled={isPending}>
            Add by id
          </Button>
        </form>

        <div className="flex flex-col gap-1.5">
          {voices.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No Fish Audio voices registered yet.
            </p>
          )}
          {voices.map((voice) => (
            <div
              key={voice.id}
              className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{voice.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {voice.gender} · {voice.accent}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Preview ${voice.name}`}
                disabled={isPending}
                onClick={() => handlePreview(voice)}
              >
                {busyId === `preview:${voice.id}` ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${voice.name}`}
                disabled={isPending}
                onClick={() => handleDelete(voice.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        {audioUrl && (
          <audio key={audioUrl} controls autoPlay src={audioUrl} className="h-8 max-w-full" />
        )}
        {message && (
          <p
            role={message.kind === "error" ? "alert" : undefined}
            className={cn(
              "text-sm",
              message.kind === "error" ? "text-danger" : "text-muted-foreground",
            )}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
