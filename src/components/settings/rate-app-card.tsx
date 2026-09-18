"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { RatingModal } from "@/components/learning/rating-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";

/**
 * Settings' always-available counterpart to RatingPrompt's one-time
 * automatic pop-up (see that component's own doc comment) — the same
 * 5-star + comment card (RatingModal), just reachable on demand instead of
 * gated behind "second lesson ever completed, never shown before". Never
 * touches rating-storage's hasRatedApp() itself: a learner who already saw
 * the automatic prompt, or already rated from here once, can always come
 * back and rate again if their opinion changes.
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
      <RatingModal open={open} onOpenChange={setOpen} lessonId="settings" mode="settings" />
    </>
  );
}
