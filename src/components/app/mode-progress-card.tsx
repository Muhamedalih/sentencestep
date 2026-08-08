"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getFreeLessons, getLessons } from "@/data/lessons";
import { useProgress } from "@/hooks/use-progress";
import { modeMeta } from "@/lib/learning-modes";
import type { LearningMode } from "@/types/content";

export function ModeProgressCard({ mode }: { mode: LearningMode }) {
  const { progress, isLoaded } = useProgress();

  const copy = modeMeta[mode];
  const Icon = copy.icon;
  const total = getLessons(mode).length;
  const free = getFreeLessons(mode).length;
  const completed = isLoaded ? progress[mode].length : 0;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="bg-brand-muted text-primary mb-2 flex size-11 items-center justify-center rounded-lg">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-medium">
            <span>
              {completed} / {total} complete
            </span>
            <span>{free} free</span>
          </div>
          <Progress value={percent} />
        </div>
        <Button asChild variant="secondary" className="justify-between">
          <Link href={`/learn/${mode}`}>
            {completed > 0 ? "Continue" : "Start"}
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
