import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DifficultyComparison,
  StoryCurriculumContext,
  StoryDifficultyStats,
} from "@/lib/admin/stories-curriculum-context";

function StatBlock({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}

const COMPARISON_LABEL: Record<DifficultyComparison, string> = {
  "below-typical": "Below typical",
  "around-typical": "Around typical",
  "above-typical": "Above typical",
};

function formatAverage(value: number): string {
  return value.toFixed(1);
}

function NeighborStat({
  label,
  neighbor,
  emptyLabel,
}: {
  label: string;
  neighbor: StoryDifficultyStats | null;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {neighbor ? (
        <>
          <span className="text-sm font-semibold">{neighbor.title}</span>
          <span className="text-muted-foreground text-xs">
            {neighbor.sentenceCount} sentences · {formatAverage(neighbor.averageWordsPerSentence)}{" "}
            avg words/sentence
          </span>
        </>
      ) : (
        <span className="text-muted-foreground text-sm">{emptyLabel}</span>
      )}
    </div>
  );
}

/**
 * Read-only editorial reference shown in the admin Stories editor. Unlike
 * Normal's Curriculum Recycling panel, this never labels anything "healthy"/
 * "light"/"high" reuse and never flags a lesson — Stories have no
 * establish/build/integrate role to interpret the numbers against (see
 * stories-curriculum-context.ts's doc comment). It only surfaces plain
 * counts and a small sample of shared words as reference information.
 */
export function StoriesCurriculumContextPanel({
  context,
}: {
  context: StoryCurriculumContext | null;
}) {
  if (!context) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stories Curriculum Context</CardTitle>
          <CardDescription>Reference only — has no effect on publishing.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This Story isn&apos;t part of the published catalog yet, so there&apos;s nothing to
            compare it against. Context appears here once it&apos;s published.
          </p>
        </CardContent>
      </Card>
    );
  }

  const precedingCount = context.precedingStoriesAtLevel.length;
  const recentPreceding = context.precedingStoriesAtLevel.slice(-3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stories Curriculum Context</CardTitle>
        <CardDescription>
          Where this Story sits in the catalog, and what vocabulary already exists around it —
          reference only, has no effect on publishing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{`Level ${context.level}`}</Badge>
          <Badge variant="secondary">{context.unit ? context.unit.title : "No unit"}</Badge>
        </div>

        {context.unit && <p className="text-muted-foreground text-xs">{context.unit.objective}</p>}

        <StatBlock
          label="Stories before this one at this Level"
          value={String(precedingCount)}
          hint={
            recentPreceding.length > 0
              ? `Most recent: ${recentPreceding.map((s) => `"${s.title}"`).join(", ")}`
              : "First Story at this Level"
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatBlock
            label="Content words in this Story"
            value={String(context.totalContentWords)}
          />
          <StatBlock
            label="Already used earlier at this Level"
            value={String(context.overlapWithEarlierStoriesAtLevel)}
          />
          <StatBlock
            label="Already known from Normal lessons"
            value={String(context.overlapWithNormalVocabulary)}
            hint="At or below this Level"
          />
        </div>

        {context.sampleSharedWithNormal.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Example words shared with Normal-mode vocabulary
            </span>
            <div className="flex flex-wrap gap-1.5">
              {context.sampleSharedWithNormal.map((word) => (
                <Badge key={word} variant="muted">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t pt-4">
          <span className="text-muted-foreground text-xs font-medium">Difficulty Context</span>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatBlock
              label="Sentence count"
              value={String(context.difficulty.currentStory.sentenceCount)}
              hint={COMPARISON_LABEL[context.difficulty.currentStory.sentenceCountComparison]}
            />
            <StatBlock
              label="Average words/sentence"
              value={formatAverage(context.difficulty.currentStory.averageWordsPerSentence)}
              hint={COMPARISON_LABEL[context.difficulty.currentStory.wordsPerSentenceComparison]}
            />
            <StatBlock
              label="Level average sentence count"
              value={formatAverage(context.difficulty.sameLevel.averageSentenceCount)}
            />
            <StatBlock
              label="Level average words/sentence"
              value={formatAverage(context.difficulty.sameLevel.averageWordsPerSentence)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NeighborStat
              label="Previous Story at this Level"
              neighbor={context.difficulty.previousAtLevel}
              emptyLabel="First Story at this Level"
            />
            <NeighborStat
              label="Next Story at this Level"
              neighbor={context.difficulty.nextAtLevel}
              emptyLabel="Most recent Story at this Level"
            />
          </div>
        </div>

        <p className="text-muted-foreground text-xs italic">
          Reference only — Stories aren&apos;t required to reuse this vocabulary or match a
          percentage, and difficulty context is not a score.
        </p>
      </CardContent>
    </Card>
  );
}
