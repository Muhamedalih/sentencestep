"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";

import { RatingModal } from "@/components/learning/rating-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";

/**
 * Settings' always-available counterpart to RatingPrompt's automatic
 * pop-up (see that component's own doc comment) — the same 5-star +
 * comment card (RatingModal), just reachable on demand instead of gated
 * behind lesson-completion milestones. Never touches rating-storage's
 * hasRatedApp() itself: a learner who already saw the automatic prompt, or
 * already rated from here once, can always come back and rate again if
 * their opinion changes.
 *
 * Also opens itself when linked to with ?openRating=1 — milestoneEmail's
 * "tell us how it's going" link points here rather than adding another
 * in-app popup, since a genuine achievement email is already a moment a
 * rating ask reads as sincere. OpenRatingFromQuery is split into its own
 * component/Suspense boundary because useSearchParams requires one.
 */
export function RateAppCard() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.settings.rateAppHeading}</CardTitle>
          <CardDescription>{t.settings.rateAppSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => setOpen(true)} className="w-fit">
            <Star className="size-4" aria-hidden="true" />
            {t.settings.rateAppButton}
          </Button>
        </CardContent>
      </Card>
      <Suspense fallback={null}>
        <OpenRatingFromQuery setOpen={setOpen} />
      </Suspense>
      <RatingModal open={open} onOpenChange={setOpen} lessonId="settings" mode="settings" />
    </>
  );
}

function OpenRatingFromQuery({ setOpen }: { setOpen: (open: boolean) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("openRating") !== "1") return;
    setOpen(true);
    // Strips the param so refreshing the settings page doesn't reopen the
    // modal every time.
    router.replace("/learn/settings", { scroll: false });
  }, [searchParams, setOpen, router]);

  return null;
}
