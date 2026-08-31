"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { tierSupportLabel } from "@/lib/levels";
import { STARTING_LEVEL_TIERS } from "@/lib/progress/starting-level";
import { cn } from "@/lib/utils";
import { updateStartingLevelAction } from "@/lib/supabase/profile-actions";
import type { ProfileActionState } from "@/lib/supabase/profile-actions";

const initialState: ProfileActionState = {};

/** Lets a learner change their StartingLevelOnboarding choice later — same profiles.starting_level column, same 1/2/3 tier mapping (see STARTING_LEVEL_TIERS). Reflects the DB value, not local optimistic state, since this only ever affects a not-yet-started learner's next recommendation. */
export function StartingLevelForm({ startingLevel }: { startingLevel: number | null }) {
  const [state, formAction, pending] = useActionState(updateStartingLevelAction, initialState);
  const { t, locale } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.startingLevelHeading}</CardTitle>
        <CardDescription>{t.settings.startingLevelSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!startingLevel && (
          <p className="text-muted-foreground text-sm">{t.settings.startingLevelNotChosen}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {STARTING_LEVEL_TIERS.map(({ difficulty, level }) => {
            const isSelected = startingLevel === level;
            return (
              <form key={difficulty} action={formAction}>
                <input type="hidden" name="startingLevel" value={level} />
                <button
                  type="submit"
                  disabled={pending}
                  aria-pressed={isSelected}
                  className={cn(
                    "border-border inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                    isSelected ? "border-primary bg-brand-muted text-primary" : "hover:bg-muted",
                  )}
                >
                  {isSelected && <Check className="size-4" aria-hidden="true" />}
                  {locale ? tierSupportLabel(difficulty, locale) : ""}
                </button>
              </form>
            );
          })}
        </div>

        {state?.error && (
          <p role="alert" className="text-danger text-sm">
            {state.error}
          </p>
        )}
        {state?.success && <p className="text-success text-sm">{state.success}</p>}
      </CardContent>
    </Card>
  );
}
