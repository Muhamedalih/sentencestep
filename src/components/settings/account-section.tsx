"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogOut } from "lucide-react";

import { InitialsAvatar } from "@/components/app/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { signOut, updateDisplayNameAction } from "@/lib/supabase/auth-actions";
import type { AuthActionState } from "@/lib/supabase/auth-actions";
import { getLearnerLevel, learnerLevelSupportLabel } from "@/lib/progress/learner-level";
import { clearProgress } from "@/lib/progress/store";
import type { StreakState } from "@/lib/progress/types";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { AccessState } from "@/lib/billing/types";
import { cn } from "@/lib/utils";

const initialNameState: AuthActionState = {};

/** A clear, restrained "this is clickable" cue — a small lift + shadow on hover, settling back on press — shared by every button on this card so they read as one consistent set rather than each having its own feel. */
const buttonLift =
  "transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0";

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-muted flex flex-col items-center gap-1 rounded-lg py-3 text-center md:py-4">
      <span
        className="font-mono text-xl leading-none font-extrabold tabular-nums md:text-2xl"
        dir="ltr"
      >
        {value}
      </span>
      <span className="text-muted-foreground text-[11px] font-semibold md:text-xs">{label}</span>
    </div>
  );
}

/**
 * The old separate "الملف الشخصي" (display-name form) and "الحساب" (account
 * overview) tabs merged into one — both were really the same "who am I on
 * this account" concept split across two clicks for no reason. This is now
 * the single Profile tab: identity + stat tiles + plan first (what used to
 * be AccountSection), then the display-name edit form directly below it
 * (what used to be ProfileForm), then sign-out last — one Card so the two
 * pieces read as one coherent section instead of two stacked boxes.
 */
export function AccountSection({
  t,
  locale,
  userId,
  displayName,
  email,
  access,
  memberSince,
  country,
  xp,
  streak,
  sessionCount,
  wordsLearnedCount,
}: {
  t: Dictionary;
  locale: SupportLocale | null;
  userId: string;
  displayName: string | null;
  email: string;
  access: AccessState;
  /** ISO date string, or null if unavailable — falls back to omitting the row entirely rather than showing a broken date. */
  memberSince: string | null;
  /** Lowercase ISO 3166-1 alpha-2 code (see fetchProfileCountry), or null if never chosen. */
  country: string | null;
  xp: number;
  streak: StreakState | null;
  sessionCount: number;
  wordsLearnedCount: number;
}) {
  const learnerLevel = getLearnerLevel(xp);
  const countryName = country
    ? (new Intl.DisplayNames([locale ?? "en"], { type: "region" }).of(country.toUpperCase()) ??
      country.toUpperCase())
    : null;
  const [nameState, nameFormAction, namePending] = useActionState(
    updateDisplayNameAction,
    initialNameState,
  );

  return (
    <Card className="md:py-8">
      <CardHeader className="md:px-8">
        <CardTitle className="text-xl md:text-2xl">{t.settings.profileHeading}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 md:gap-6 md:px-8">
        <div className="flex items-center gap-3.5 md:gap-4">
          <InitialsAvatar
            seed={userId}
            displayName={displayName}
            email={email}
            className="size-14 text-lg md:size-16 md:text-xl"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-lg font-extrabold tracking-tight md:text-xl">
                {displayName || email}
              </span>
              <Badge variant="muted" className="md:px-3 md:py-1 md:text-sm">
                {learnerLevelSupportLabel(learnerLevel.level.name, t)}
              </Badge>
            </div>
            <p className="text-muted-foreground truncate text-sm md:text-base">{email}</p>
            <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs md:text-sm">
              {memberSince && (
                <span>
                  {t.settings.memberSinceLabel.replace(
                    "{date}",
                    new Date(memberSince).toLocaleDateString(),
                  )}
                </span>
              )}
              {memberSince && countryName && <span aria-hidden="true">·</span>}
              {countryName && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={`fi fi-${country} !block !h-3 !w-4 rounded-[2px] bg-center md:!h-3.5 md:!w-5`}
                  />
                  {countryName}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3">
          <StatTile value={xp} label={t.settings.xpLabel} />
          <StatTile value={streak?.currentStreak ?? 0} label={t.lesson.streakLabel} />
          <StatTile value={sessionCount} label={t.stats.sessionsLabel} />
          <StatTile value={wordsLearnedCount} label={t.settings.wordsLearnedLabel} />
        </div>

        <div className="border-border flex items-center justify-between gap-4 border-t pt-4 text-sm md:pt-5 md:text-base">
          <span className="text-muted-foreground">{t.settings.planLabel}</span>
          <div className="flex items-center gap-2">
            <Badge
              variant={access.isPremium ? "default" : "muted"}
              className="md:px-3 md:py-1 md:text-sm"
            >
              {access.isPremium ? t.common.premium : t.common.freePlan}
            </Badge>
            {access.isPremium ? (
              <ManageBillingButton
                className={cn(buttonLift, "hover:shadow-md md:h-10 md:px-5 md:text-base")}
              />
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className={cn(
                  buttonLift,
                  "hover:border-primary/50 hover:shadow-md md:h-10 md:px-5 md:text-base",
                )}
              >
                <Link href="/upgrade">{t.common.upgrade}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="border-border border-t pt-4 md:pt-5">
          <h3 className="text-sm font-semibold md:text-base">{t.settings.displayNameLabel}</h3>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {t.settings.profileSubtitle}
          </p>

          <form action={nameFormAction} className="mt-3 flex flex-col gap-3">
            <Input
              name="displayName"
              type="text"
              autoComplete="name"
              maxLength={50}
              defaultValue={displayName ?? ""}
              aria-invalid={Boolean(nameState?.error)}
              className="max-w-sm md:h-11 md:max-w-md md:text-base"
            />

            {nameState?.error && (
              <p role="alert" className="text-danger text-sm">
                {nameState.error}
              </p>
            )}
            {nameState?.success && <p className="text-success text-sm">{nameState.success}</p>}

            <Button
              type="submit"
              disabled={namePending}
              size="sm"
              className={cn(
                buttonLift,
                "hover:shadow-primary/25 w-fit hover:shadow-lg md:h-10 md:px-5 md:text-base",
              )}
            >
              {namePending ? t.settings.savingDisplayName : t.settings.saveDisplayName}
            </Button>
          </form>
        </div>

        {/* The account header's own trigger now links straight here instead
            of opening a popover (see AccountMenu) — sign-out used to live
            only in that popover, so it moved here to keep it reachable.
            A plain onClick (not a <form action={signOut}>) guarantees
            clearProgress() (client-only, localStorage) always runs, in
            order, before the signOut server action's own redirect: a
            <form action> falls back to a native, JS-free POST when hydration
            hasn't finished yet, which would call signOut without ever
            running an onSubmit handler. Without clearProgress() running,
            this browser's own guest-progress blob still has a real
            startingLevel in it, and root-html-shell.tsx's
            RETURNING_GUEST_REDIRECT_SCRIPT reads exactly that, before React
            even hydrates, to bounce a "returning guest" straight to /learn —
            which would skip right past IntroLanding on the very next visit
            to "/", the same page signOut redirects to. */}
        <div className="border-border border-t pt-4 md:pt-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearProgress();
              void signOut();
            }}
            className={cn(
              buttonLift,
              "text-danger hover:shadow-danger/20 w-fit hover:shadow-md md:h-10 md:px-5 md:text-base md:[&_svg]:size-[18px]",
            )}
          >
            <LogOut aria-hidden="true" />
            {t.common.signOut}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
