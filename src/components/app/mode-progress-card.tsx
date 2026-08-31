"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { filterFree } from "@/lib/content-helpers";
import { useProgress } from "@/hooks/use-progress";
import { difficultyForLevel, tierLabel } from "@/lib/levels";
import { modeMeta } from "@/lib/learning-modes";
import { getCurrentLevel } from "@/lib/progress/level";
import type { LearningMode, LessonUnit } from "@/types/content";

export function ModeProgressCard({ mode, units }: { mode: LearningMode; units: LessonUnit[] }) {
  const { getCompletedIds, isLoaded } = useProgress();

  const copy = modeMeta[mode];
  const Icon = copy.icon;
  const total = units.length;
  const free = filterFree(units).length;
  const completedIds = isLoaded ? getCompletedIds(mode) : [];
  const completed = completedIds.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const currentLevel = getCurrentLevel(units, completedIds);
  const tier = tierLabel(difficultyForLevel(currentLevel));

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <div className="bg-brand-muted text-primary flex size-11 items-center justify-center rounded-lg">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          {isLoaded && completed > 0 && (
            <Badge variant="secondary">
              Level {currentLevel} · {tier.label}
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoaded ? (
          <div>
            <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-medium">
              <span>
                {completed} / {total} complete
              </span>
              <span>{free} free</span>
            </div>
            <Progress value={percent} />
          </div>
        ) : (
          // Neutral pulse instead of flashing "0 / N complete" for a
          // returning learner whose real progress hasn't loaded yet.
          <div aria-hidden="true">
            <div className="bg-muted mb-1.5 h-4 w-28 animate-pulse rounded" />
            <Progress value={0} className="animate-pulse" />
          </div>
        )}
        <Button asChild variant="secondary" className="justify-between">
          <Link href={`/learn/${mode}`}>
            {isLoaded && completed > 0 ? "Continue" : "Start"}
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
