"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteVocabularyWord, saveWordGroupWords } from "@/lib/admin/word-lists-actions";
import { validateVocabularyWordInput } from "@/lib/admin/word-lists-validation";
import type { AdminVocabularyWord } from "@/lib/admin/word-lists-queries";
import { WORDS_PER_GROUP } from "@/types/word-lists";

interface WordRow {
  /** Present for a word already saved to the database; absent for one just added in this session. */
  id?: string;
  targetWord: string;
  sentence: string;
  hintAr: string;
  /** The IPA override as typed; empty means "use the generated fallback". */
  ipa: string;
  /** The generated fallback for this word, shown as the IPA field's placeholder. Not saved. */
  suggestedIpa: string;
  /** Extra accepted answers as typed (comma-separated); null when the database cannot store them yet, which hides the field and keeps it out of the save. */
  alternates: string | null;
}

function emptyWord(alternatesSupported: boolean): WordRow {
  return {
    targetWord: "",
    sentence: "",
    hintAr: "",
    ipa: "",
    suggestedIpa: "",
    alternates: alternatesSupported ? "" : null,
  };
}

/**
 * Manages one group's vocabulary words. Deliberately its own form, separate
 * from WordGroupForm (the group's own title/level/status) — saving the
 * words list and saving group metadata are independent operations with
 * different failure modes, the same separation LessonForm collapses into
 * one form (a lesson's sentences are inseparable from the lesson itself)
 * but book Sections keep apart (see the Library admin's own Sections page).
 */
export function WordGroupWordsForm({
  groupId,
  initial,
  alternatesSupported,
}: {
  groupId: string;
  initial: AdminVocabularyWord[];
  /** The database has the accepted_answers column — see AdminWordGroupDetail. */
  alternatesSupported: boolean;
}) {
  const [words, setWords] = useState<WordRow[]>(
    initial.length > 0
      ? initial.map((w) => ({
          id: w.id,
          targetWord: w.targetWord,
          sentence: w.sentence,
          hintAr: w.hintAr,
          ipa: w.ipa ?? "",
          suggestedIpa: w.suggestedIpa ?? "",
          alternates: w.alternates === null ? null : w.alternates.join(", "),
        }))
      : [emptyWord(alternatesSupported)],
  );
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateWord(index: number, patch: Partial<WordRow>) {
    setWords((prev) => prev.map((word, i) => (i === index ? { ...word, ...patch } : word)));
    setSuccess(null);
  }

  function addWord() {
    setWords((prev) => [...prev, emptyWord(alternatesSupported)]);
    setSuccess(null);
  }

  function moveWord(index: number, direction: -1 | 1) {
    setWords((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const moved = next[index]!;
      next[index] = next[target]!;
      next[target] = moved;
      return next;
    });
    setSuccess(null);
  }

  function removeWord(index: number) {
    const word = words[index];
    if (!word) return;

    // A word never saved yet has nothing server-side to remove — drop it
    // locally. A saved word is a separate, immediately-confirmed delete
    // (never folded into the bulk save below — see saveWordGroupWords's
    // doc comment for why).
    if (!word.id) {
      setWords((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    if (
      !window.confirm(
        `Delete "${word.targetWord || "this word"}"? Any learner progress on this specific word is deleted with it.`,
      )
    ) {
      return;
    }

    setError(null);
    startDeleting(async () => {
      const result = await deleteVocabularyWord(word.id!, groupId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setWords((prev) => prev.filter((_, i) => i !== index));
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveWordGroupWords(groupId, words);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.success ?? "Saved.");
    });
  }

  const countNotice =
    words.length !== WORDS_PER_GROUP
      ? `This group has ${words.length} word${words.length === 1 ? "" : "s"} — the practice screen is built around groups of ${WORDS_PER_GROUP}. Saving is still allowed, but consider matching that count before publishing.`
      : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {countNotice && (
        <p className="text-muted-foreground bg-muted rounded-lg px-3 py-2 text-xs">{countNotice}</p>
      )}

      {words.map((word, index) => (
        <div key={word.id ?? `new-${index}`} className="border-border rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold">Word {index + 1}</span>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveWord(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveWord(index, 1)}
                disabled={index === words.length - 1}
                aria-label="Move down"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeWord(index)}
                disabled={isDeleting || words.length === 1}
                aria-label="Remove word"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`target-${index}`} className="text-xs font-medium">
                Target word
              </label>
              <Input
                id={`target-${index}`}
                value={word.targetWord}
                onChange={(e) => updateWord(index, { targetWord: e.target.value })}
                dir="ltr"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`hint-${index}`} className="text-xs font-medium">
                Arabic hint
              </label>
              <Input
                id={`hint-${index}`}
                value={word.hintAr}
                onChange={(e) => updateWord(index, { hintAr: e.target.value })}
                dir="rtl"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor={`ipa-${index}`} className="text-xs font-medium">
                IPA pronunciation (optional)
              </label>
              <Input
                id={`ipa-${index}`}
                value={word.ipa}
                onChange={(e) => updateWord(index, { ipa: e.target.value })}
                placeholder={word.suggestedIpa ? `${word.suggestedIpa} (automatic)` : "e.g. ænt"}
                dir="ltr"
              />
              <p className="text-muted-foreground text-xs">
                Shown on the summary after each block of five words. Leave empty to use the
                automatic one; the slashes are added for you.
              </p>
            </div>
            {word.alternates !== null && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor={`alternates-${index}`} className="text-xs font-medium">
                  Also accepted answers (optional)
                </label>
                <Input
                  id={`alternates-${index}`}
                  value={word.alternates}
                  onChange={(e) => updateWord(index, { alternates: e.target.value })}
                  placeholder="e.g. grey, flat"
                  dir="ltr"
                />
                <p className="text-muted-foreground text-xs">
                  British spellings and synonyms that fit the sentence and the Arabic hint,
                  separated by commas. With Smart word practice on (Admin → Features), typing one
                  counts as right and says “also correct”.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor={`sentence-${index}`} className="text-xs font-medium">
                Sentence (use ___ where the word belongs)
              </label>
              <Input
                id={`sentence-${index}`}
                value={word.sentence}
                onChange={(e) => updateWord(index, { sentence: e.target.value })}
                dir="ltr"
                required
              />
              {word.targetWord.trim() &&
                word.sentence.trim() &&
                validateVocabularyWordInput(word).length > 0 && (
                  <p className="text-danger text-xs">{validateVocabularyWordInput(word)[0]}</p>
                )}
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addWord} className="w-fit">
        Add word
      </Button>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save words"}
        </Button>
        {success && <p className="text-success text-sm">{success}</p>}
      </div>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
