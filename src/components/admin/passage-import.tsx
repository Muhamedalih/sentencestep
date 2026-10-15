"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { importPassage } from "@/lib/admin/passages-actions";
import type { ImportResult } from "@/lib/admin/passages-actions";

/**
 * Adds a passage from pasted JSON. "Check" says whether it can be added without saving
 * anything; "Add as draft" saves it — hidden from learners, Free, with its own draft word
 * lesson and a voice for each character — ready for its voices to be looked over, its audio
 * narrated and the passage published.
 */
export function PassageImport() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState<(ImportResult & { added?: boolean }) | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(mode: "check" | "add") {
    setResult(null);
    startTransition(async () => {
      const outcome = await importPassage(text, mode);
      setResult({ ...outcome, added: mode === "add" && Boolean(outcome.id) });
      if (mode === "add" && outcome.id) {
        setText("");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add a passage</CardTitle>
        <CardDescription>
          Paste one passage as JSON, in the shape of the authored passages (see
          docs/engagement-features.md, “Passages”). It is checked against every content rule, then
          added as a draft — hidden from learners and free — so you can pick its voices, narrate it
          and publish it when it is ready.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={10}
          dir="ltr"
          spellCheck={false}
          aria-label="Passage JSON"
          placeholder='{ "slug": "my-passage", "order": 27, "level": "A1", … }'
          className="border-input bg-background w-full rounded-lg border p-3 font-mono text-xs leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => run("check")}
            disabled={isPending || !text.trim()}
          >
            {isPending ? "Working…" : "Check"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => run("add")}
            disabled={isPending || !text.trim()}
          >
            Add as draft
          </Button>
        </div>

        {result?.error && (
          <p role="alert" className="text-danger text-sm">
            {result.error}
          </p>
        )}
        {result?.problems && result.problems.length > 0 && (
          <div role="alert" className="text-danger text-sm">
            <p className="font-medium">This passage can&apos;t be added yet:</p>
            <ul className="mt-1 list-disc ps-5">
              {result.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}
        {result?.success && (
          <p className="text-sm">
            {result.success}{" "}
            {result.added && result.id && (
              <Link
                href={`/admin/passages/${result.id}`}
                className="text-primary font-medium underline"
              >
                Open it
              </Link>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
