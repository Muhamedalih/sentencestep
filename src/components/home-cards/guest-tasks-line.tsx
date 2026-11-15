"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Target } from "lucide-react";

import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";

import { GREY, HOME_CARD_COLORS, TASKS } from "./palette";
import { useGreyHome } from "./use-grey-home";

/**
 * A visitor without an account on the Home cards page (permission guestCards): where a learner has
 * the tasks strip (TasksBox), they get the same box with one line — Today's tasks, and that an
 * account turns them on and keeps the streak — and the free-account button. It stands in for the
 * classic Home's GuestFeatureTeaser card, and shows exactly when that card would (useFeatures's
 * guestTeaser: a guest, with a feature that needs an account open).
 */
export function GuestTasksLine() {
  const { guestTeaser } = useFeatures();
  const { t } = useLocale();
  const grey = useGreyHome();
  if (!guestTeaser) return null;
  // The grey look of Home (permission "greyCalm"): the same neutral grey and small corners as the tasks capsule.
  const colors = grey ? GREY.colors.neutral : HOME_CARD_COLORS.lesson;
  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-(--hc-edge) px-3.5 py-3 xl:h-[4.4rem] xl:py-0 xl:pe-4"
      style={
        {
          background: colors.background,
          "--hc-edge": colors.edge,
          borderRadius: grey ? GREY.radius.capsule : undefined,
        } as CSSProperties
      }
    >
      <div className="flex min-w-0 flex-1 basis-56 items-center gap-3.5">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-[13px] border"
          style={{
            background: TASKS.tile.background,
            borderColor: TASKS.tile.border,
            color: TASKS.tile.ink,
          }}
        >
          <Target className="size-[22px]" strokeWidth={1.8} />
        </span>
        <p dir="auto" className="min-w-0 text-[15.5px]">
          <span className="font-bold">{t.quests.heading}</span>
          <span className="text-muted-foreground"> · {t.quests.guestLine}</span>
        </p>
      </div>
      <Button asChild size="sm" className="ms-auto shrink-0">
        <Link href="/register">{t.quests.guestCta}</Link>
      </Button>
    </div>
  );
}
