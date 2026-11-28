import type { EgyptView } from "@/lib/billing/upgrade-modal-audience";

/** Reminds an admin that the screen is drawn for Egypt, with the way out. Plain <a>: a prefetch would switch it off. */
export function EgyptViewChip({ view }: { view: EgyptView }) {
  return (
    <div
      dir="ltr"
      className="bg-card text-foreground border-border fixed bottom-3 left-3 z-40 flex items-center gap-3 rounded-full border px-4 py-2 text-xs shadow-lg"
    >
      <span>Viewing as Egypt · {view === "popup" ? "old pop-up" : "current"}</span>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/egypt-view?mode=off" className="font-semibold underline underline-offset-2">
        Exit
      </a>
    </div>
  );
}
