import { Badge } from "@/components/ui/badge";
import {
  deviceLabel,
  formatDuration,
  placeLabel,
  stayedSeconds,
  summarizeVisits,
} from "@/lib/billing/binance/visits";
import type { VisitRecord } from "@/lib/billing/binance/visits";

const TIME_ZONE = "Asia/Baghdad";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  });
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

function dayOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: TIME_ZONE });
}

/** The clock time alone when it is the same day as `reference`, otherwise the date too. */
function clockOrDate(iso: string, reference: string): string {
  return dayOf(iso) === dayOf(reference) ? formatClock(iso) : formatDateTime(iso);
}

function ActionChips({
  copiedId,
  copiedCode,
  openedGuide,
}: {
  copiedId: boolean;
  copiedCode: boolean;
  openedGuide: boolean;
}) {
  if (!copiedId && !copiedCode && !openedGuide) {
    return <span className="text-muted-foreground text-xs">Copied nothing</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {copiedId && <Badge variant="outline">Copied the ID</Badge>}
      {copiedCode && <Badge variant="outline">Copied the code</Badge>}
      {openedGuide && <Badge variant="outline">Opened the guide</Badge>}
    </span>
  );
}

function VisitLine({ visit, now }: { visit: VisitRecord; now: number }) {
  const open = now - Date.parse(visit.lastSeenAt) <= 90_000;
  return (
    <li className="flex flex-col gap-0.5 py-2 text-xs">
      <span className="font-medium tabular-nums">
        {formatDateTime(visit.openedAt)}
        {open ? (
          <span className="text-success"> · open now</span>
        ) : (
          <> → {clockOrDate(visit.lastSeenAt, visit.openedAt)}</>
        )}
        <span className="text-muted-foreground font-normal">
          {" "}
          · stayed {formatDuration(stayedSeconds(visit))}
        </span>
      </span>
      <span className="text-muted-foreground">
        On screen {formatDuration(visit.visibleSeconds)} · switched away {visit.leaves}×
      </span>
      <span className="text-muted-foreground">
        {placeLabel(visit)} · {deviceLabel(visit)}
        {visit.source ? ` · from ${visit.source}` : ""}
      </span>
      <ActionChips
        copiedId={visit.copiedId}
        copiedCode={visit.copiedCode}
        openedGuide={visit.openedGuide}
      />
    </li>
  );
}

/**
 * What the learner did on the Binance Pay payment page for one order: when it
 * was opened, whether it is open right now or when it was left and how long it
 * stayed, where the visitor was and on what device, and whether they copied the
 * ID or the order code. Several visits show the newest, with the full list one
 * click away. `paidAt` (a paid order) adds how long after opening the transfer
 * arrived.
 */
export function BinanceVisitCell({
  visits,
  now,
  paidAt = null,
}: {
  visits: VisitRecord[];
  now: number;
  paidAt?: string | null;
}) {
  const summary = summarizeVisits(visits, now);
  if (!summary) {
    return <span className="text-muted-foreground text-xs">No visit recorded</span>;
  }
  const { first, last } = summary;
  const paidAfter = paidAt ? (Date.parse(paidAt) - Date.parse(first.openedAt)) / 1000 : null;
  const lastStay = formatDuration(stayedSeconds(last));

  return (
    <div className="flex min-w-56 flex-col gap-1.5 text-xs">
      <div className="flex flex-col gap-0.5">
        {summary.count === 1 ? (
          <>
            <span className="font-medium tabular-nums">
              Opened {formatDateTime(first.openedAt)}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {summary.openNow ? (
                <span className="text-success font-medium">Open right now</span>
              ) : (
                <>Left {clockOrDate(first.lastSeenAt, first.openedAt)}</>
              )}
              {" · "}
              stayed {lastStay}
            </span>
          </>
        ) : (
          <>
            <span className="font-medium tabular-nums">
              First opened {formatDateTime(first.openedAt)} · {summary.count} visits
            </span>
            <span className="text-muted-foreground tabular-nums">
              Last visit {clockOrDate(last.openedAt, first.openedAt)}
              {summary.openNow ? (
                <span className="text-success font-medium"> · open right now</span>
              ) : (
                <> → {clockOrDate(last.lastSeenAt, last.openedAt)}</>
              )}
              {" · "}
              stayed {lastStay}
            </span>
          </>
        )}
        <span className="text-muted-foreground">
          {placeLabel(last)} · {deviceLabel(last)}
          {last.source ? ` · from ${last.source}` : ""}
        </span>
      </div>
      <ActionChips
        copiedId={summary.copiedId}
        copiedCode={summary.copiedCode}
        openedGuide={summary.openedGuide}
      />
      {paidAfter !== null && paidAfter >= 0 && (
        <span className="text-success">
          Paid {formatDuration(paidAfter)} after opening the page
        </span>
      )}
      {summary.count > 1 && (
        <details className="text-xs">
          <summary className="text-primary cursor-pointer underline underline-offset-2">
            All {summary.count} visits
          </summary>
          <ul className="divide-border mt-1 divide-y">
            {[...summary.visits].reverse().map((visit) => (
              <VisitLine key={visit.id} visit={visit} now={now} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
