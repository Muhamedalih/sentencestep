import Link from "next/link";

import { PassageBackgroundThumb } from "@/components/admin/passage-background-field";
import {
  PassageAccessSelect,
  PassageStatusSelect,
} from "@/components/admin/passage-publish-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminPassageRow } from "@/lib/admin/passages-queries";

function AudioBadge({ clips, lines }: { clips: number; lines: number }) {
  const variant = lines > 0 && clips === lines ? "success" : clips === 0 ? "muted" : "outline";
  return (
    <Badge variant={variant} title={`${clips} of ${lines} lines have a narrated clip`}>
      {clips} / {lines}
    </Badge>
  );
}

/** The Passages list: every passage, drafts included, with what an admin decides about each — published or draft, Free or Premium — right in its row. */
export function PassagesTable({ passages }: { passages: AdminPassageRow[] }) {
  if (passages.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed px-6 py-12 text-center text-sm">
        There are no passages yet. Add one below.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Picture</th>
            <th className="px-4 py-3">Passage</th>
            <th className="px-4 py-3">Voices</th>
            <th className="px-4 py-3">Audio</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Access</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {passages.map((passage) => (
            <tr key={passage.id} className="align-top">
              <td className="text-muted-foreground px-4 py-3 whitespace-nowrap tabular-nums">
                <span className="text-foreground font-semibold">{passage.level}</span> ·{" "}
                {passage.order}
              </td>
              <td className="px-4 py-3">
                <PassageBackgroundThumb
                  passageId={passage.id}
                  title={passage.title}
                  order={passage.order}
                  tone={passage.tone}
                  posterUrl={passage.posterUrl}
                />
              </td>
              <td className="max-w-64 px-4 py-3">
                <Link
                  href={`/admin/passages/${passage.id}`}
                  className="font-medium hover:underline"
                >
                  {passage.title}
                </Link>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {passage.sections} parts · {passage.lines} lines
                </p>
              </td>
              <td className="text-muted-foreground max-w-48 px-4 py-3 text-xs">
                {passage.characters.length > 0 ? passage.characters.join(", ") : "Narrator only"}
              </td>
              <td className="px-4 py-3">
                <AudioBadge clips={passage.clips} lines={passage.lines} />
              </td>
              <td className="px-4 py-3">
                <PassageStatusSelect passageId={passage.id} status={passage.status} />
              </td>
              <td className="px-4 py-3">
                <PassageAccessSelect passageId={passage.id} isFree={passage.isFree} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/passages/${passage.id}`}>Manage</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
