"use client";

import { useState, useTransition } from "react";

import { Switch } from "@/components/ui/switch";
import { setRatingsSettings } from "@/lib/admin/ratings-actions";
import { PUBLIC_REVIEWS_MAX } from "@/lib/feedback/reviews-display";
import type { RatingsSettings } from "@/lib/feedback/ratings-settings";

/** The two on/off switches for showing ratings to visitors. Each change saves at once and takes effect on the site immediately. */
export function RatingsDisplaySettings({
  initial,
  proofPreview,
  approvedWithComment,
}: {
  initial: RatingsSettings;
  /** How many approved ratings have a comment — the ones the public box can show. */
  approvedWithComment: number;
  /** What the /upgrade line would say right now, or why it can't show yet. */
  proofPreview: string;
}) {
  const [settings, setSettings] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(patch: Partial<RatingsSettings>) {
    const previous = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    setError(null);
    startTransition(async () => {
      const result = await setRatingsSettings(next);
      if (result.error) {
        setSettings(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="border-border flex flex-col gap-4 rounded-xl border p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Show ratings to visitors</h2>
        <p className="text-muted-foreground text-sm">
          Both switches start off. Each change is saved and live straight away.
        </p>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Average rating on the Upgrade page</p>
          <p className="text-muted-foreground text-sm">
            Quotes the real average and number of ratings, worked out from this page (archived
            ratings don&apos;t count). The average is only ever rounded down, and nothing is shown
            until there are enough ratings.
          </p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Right now it would say: </span>
            <span className="font-medium">{proofPreview}</span>
          </p>
        </div>
        <Switch
          aria-label="Show the average rating on the Upgrade page"
          checked={settings.showRatingProof}
          disabled={isPending}
          onChange={(event) => change({ showRatingProof: event.target.checked })}
        />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Learner comments box</p>
          <p className="text-muted-foreground text-sm">
            A box that shows the ratings you approved with &quot;Show on site&quot; below, one at a
            time, each for the seconds you set on it. It appears on the Upgrade page and on the
            first screen a new visitor sees. Turn this off to hide all of them at once without
            un-approving each one.
          </p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Approved with a comment: </span>
            <span className="font-medium">{approvedWithComment}</span>
            {approvedWithComment > PUBLIC_REVIEWS_MAX && (
              <span className="text-muted-foreground">
                {" "}
                — only the newest {PUBLIC_REVIEWS_MAX} are shown; withdraw some to choose which.
              </span>
            )}
            {approvedWithComment === 0 && (
              <span className="text-muted-foreground">
                {" "}
                — approve some below and the box appears.
              </span>
            )}
          </p>
        </div>
        <Switch
          aria-label="Allow approved ratings to be shown to visitors"
          checked={settings.showPublicRatings}
          disabled={isPending}
          onChange={(event) => change({ showPublicRatings: event.target.checked })}
        />
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
