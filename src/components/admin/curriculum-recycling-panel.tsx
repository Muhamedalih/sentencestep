import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildReuseAdvisory,
  spiralThreadsBefore,
  type RecyclingReport,
} from "@/lib/admin/curriculum-recycling";

const ROLE_LABEL: Record<string, string> = {
  establish: "Establish",
  build: "Build",
  integrate: "Integrate",
};

function StatBlock({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}

/**
 * Read-only editorial aid shown in the admin lesson editor (Part 3 of the
 * SentenceStep Curriculum Architecture work) — surfaces how much of this
 * lesson's vocabulary is new versus already present earlier in the
 * curriculum, plus its role's expectations and any relevant spiral threads.
 * Purely informational: it never edits anything, and none of its language
 * reads as pass/fail (see buildReuseAdvisory's doc comment). Only ever
 * rendered for Normal-mode lessons — Stories/Conversation have no units yet.
 */
export function CurriculumRecyclingPanel({ report }: { report: RecyclingReport | null }) {
  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Curriculum Recycling</CardTitle>
          <CardDescription>Advisory only — has no effect on publishing.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This lesson isn&apos;t part of the published curriculum yet, so there&apos;s nothing to
            compare it against. Recycling data appears here once it&apos;s published.
          </p>
        </CardContent>
      </Card>
    );
  }

  const advisory = buildReuseAdvisory(report);
  const threads = spiralThreadsBefore(report.orderIndex);
  const roleLabel = report.role ? (ROLE_LABEL[report.role] ?? report.role) : "No role assigned";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curriculum Recycling</CardTitle>
        <CardDescription>
          How this lesson&apos;s vocabulary relates to what came before it — advisory only, has no
          effect on publishing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {report.unit ? `Unit ${report.unit.orderIndex}` : "No unit"}
          </Badge>
          <Badge variant="outline">{`Level ${report.level}`}</Badge>
          <Badge variant="secondary">{roleLabel}</Badge>
        </div>

        {report.unit && (
          <p className="text-muted-foreground text-xs">
            <span className="font-medium">{report.unit.title}</span> — {report.unit.objective}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="New content words" value={String(report.newCount)} />
          <StatBlock label="Reused content words" value={String(report.reusedCount)} />
          <StatBlock
            label="Reused share"
            value={report.reusedSharePercent === null ? "—" : `${report.reusedSharePercent}%`}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-medium">Signal</span>
            {advisory.label ? (
              <Badge variant="muted" className="w-fit">
                {advisory.label}
              </Badge>
            ) : (
              <span className="text-sm font-semibold">—</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatBlock
            label="Overlap with previous lesson"
            value={report.previousLesson ? String(report.previousLesson.overlapCount) : "—"}
            hint={
              report.previousLesson
                ? `vs. "${report.previousLesson.title}"`
                : "First published lesson"
            }
          />
          <StatBlock
            label="Overlap with earlier in unit"
            value={report.isFirstInUnit ? "—" : String(report.unitPriorOverlapCount ?? 0)}
            hint={report.isFirstInUnit ? "First lesson in its unit" : undefined}
          />
        </div>

        {advisory.notes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {advisory.notes.map((note) => (
              <p
                key={note}
                className="text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 text-xs"
              >
                {note}
              </p>
            ))}
          </div>
        )}

        {threads.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Spiral threads to consider
            </span>
            <ul className="flex flex-col gap-1">
              {threads.map((thread) => (
                <li key={thread.label} className="text-muted-foreground text-xs">
                  {thread.text}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs italic">
              Reference only — not a requirement to use any of these.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
