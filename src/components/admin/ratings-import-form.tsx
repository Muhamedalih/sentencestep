"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { importRatingsCsv, type RatingsImportResult } from "@/lib/admin/ratings-import-actions";

/**
 * One-time "Import from the old sheet": pick the CSV downloaded from the Google
 * Sheet, check it, then import. Checking writes nothing, and importing the same
 * file again adds nothing twice.
 */
export function RatingsImportForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [offset, setOffset] = useState("+03:00");
  const [result, setResult] = useState<RatingsImportResult | null>(null);
  const [checked, setChecked] = useState(false);
  const [isPending, startTransition] = useTransition();

  function run(dryRun: boolean) {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setResult({ error: "Choose the CSV file first." });
      return;
    }
    startTransition(async () => {
      const text = await file.text();
      const outcome = await importRatingsCsv(text, offset, dryRun);
      setResult(outcome);
      setChecked(dryRun && !outcome.error && (outcome.toAdd ?? 0) > 0);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="text-muted-foreground list-decimal ps-5 text-sm">
        <li>In the Google Sheet: File → Download → Comma-separated values (.csv).</li>
        <li>Choose that file below and press Check — nothing is saved yet.</li>
        <li>If the numbers look right, press Import.</li>
      </ol>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          CSV file
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            disabled={isPending}
            onChange={() => {
              setResult(null);
              setChecked(false);
            }}
            className="text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Sheet time zone
          <input
            value={offset}
            onChange={(event) => {
              setOffset(event.target.value);
              setChecked(false);
            }}
            dir="ltr"
            className="border-border bg-background w-24 rounded-md border px-2 py-1.5 text-sm font-normal"
            aria-describedby="ratings-import-tz"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => run(true)}
        >
          {isPending ? "Working…" : "Check"}
        </Button>
        <Button type="button" size="sm" disabled={isPending || !checked} onClick={() => run(false)}>
          Import
        </Button>
      </div>
      <p id="ratings-import-tz" className="text-muted-foreground text-xs">
        Dates are read as day/month/year. +03:00 is Iraq time; change it only if your sheet shows a
        different time zone.
      </p>

      {result?.error && (
        <p role="alert" className="text-danger text-sm">
          {result.error}
        </p>
      )}
      {result && result.read !== undefined && (
        <div className="text-sm">
          <p>
            {result.added !== undefined ? (
              <>
                <span className="font-medium">Added {result.added} ratings.</span>{" "}
              </>
            ) : null}
            Found {result.read} ratings in the file
            {result.alreadyThere ? `, ${result.alreadyThere} already here` : ""}
            {result.added === undefined ? `, ${result.toAdd} new to add` : ""}
            {result.skippedCount ? `, ${result.skippedCount} rows couldn't be read` : ""}.
          </p>
          {result.skipped && result.skipped.length > 0 && (
            <ul className="text-muted-foreground mt-1 list-disc ps-5 text-xs">
              {result.skipped.map((row) => (
                <li key={row.line}>
                  Line {row.line}: {row.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
