"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "framer-motion";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

import { PosterPicture } from "@/components/passages/poster-picture";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setPassageOrder } from "@/lib/admin/passages-actions";
import type { AdminPassageRow } from "@/lib/admin/passages-queries";
import { posterArtFor } from "@/lib/passages/art";
import { movedBy } from "@/lib/passages/order";
import { PASSAGE_LEVELS } from "@/lib/passages/types";
import type { PassageLevel } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

function OrderRow({
  passage,
  position,
  count,
  busy,
  onMove,
  onDrop,
}: {
  passage: AdminPassageRow;
  position: number;
  count: number;
  busy: boolean;
  onMove: (by: number) => void;
  onDrop: () => void;
}) {
  const controls = useDragControls();
  const art = posterArtFor(passage.tone, passage.order);

  return (
    <Reorder.Item
      value={passage.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      whileDrag={{ scale: 1.015, boxShadow: "0 10px 28px rgba(0, 0, 0, 0.22)" }}
      className="bg-card relative flex items-center gap-3 rounded-xl border px-3 py-2 select-none"
    >
      <button
        type="button"
        aria-label={`Drag ${passage.title} to another place`}
        title="Drag to another place"
        disabled={busy}
        onPointerDown={(event) => controls.start(event)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-primary -ml-1 cursor-grab touch-none rounded-md p-1 outline-none focus-visible:ring-2 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      <span className="text-muted-foreground w-6 text-right text-sm font-semibold tabular-nums">
        {position}
      </span>
      <span
        aria-hidden="true"
        className="relative block aspect-[3/4] w-8 shrink-0 overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/10"
        style={{ backgroundImage: art.backgroundImage }}
      >
        <PosterPicture src={passage.posterUrl} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{passage.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {passage.status === "draft" && <Badge variant="muted">Draft</Badge>}
          <Badge variant={passage.isFree ? "success" : "outline"}>
            {passage.isFree ? "Free" : "Premium"}
          </Badge>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={busy || position === 1}
          onClick={() => onMove(-1)}
          aria-label={`Move ${passage.title} up`}
          title="Move up"
        >
          <ChevronUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={busy || position === count}
          onClick={() => onMove(1)}
          aria-label={`Move ${passage.title} down`}
          title="Move down"
        >
          <ChevronDown aria-hidden="true" />
        </Button>
      </div>
    </Reorder.Item>
  );
}

/**
 * One level's passages, in the order learners see them. Dragging by the handle — or the arrows —
 * changes the order on screen at once and saves it the moment the passage is dropped; if the save is
 * refused the list goes back to what is saved, with the reason under it.
 */
function LevelOrder({ level, passages }: { level: PassageLevel; passages: AdminPassageRow[] }) {
  const router = useRouter();
  const savedKey = passages.map((passage) => passage.id).join("|");
  const [ids, setIds] = useState(() => savedKey.split("|"));
  // What is on screen right now, readable at the moment a drop saves it (state would be a render behind).
  const latest = useRef(ids);
  const [note, setNote] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // A refresh (or an added passage) brings the saved order back in.
  useEffect(() => {
    const saved = savedKey.split("|");
    latest.current = saved;
    setIds(saved);
  }, [savedKey]);

  const byId = new Map(passages.map((passage) => [passage.id, passage]));

  function arrange(next: string[]) {
    latest.current = next;
    setIds(next);
  }

  function save() {
    const next = latest.current;
    if (next.join("|") === savedKey) return;
    setNote(null);
    startTransition(async () => {
      const result = await setPassageOrder(level, next);
      if (result.error) {
        arrange(savedKey.split("|"));
        setNote({ kind: "error", text: result.error });
      } else {
        setNote({ kind: "success", text: result.success ?? "Saved." });
      }
      router.refresh();
    });
  }

  function move(index: number, by: number) {
    arrange(movedBy(latest.current, index, by));
    save();
  }

  return (
    <div className="flex flex-col gap-3">
      <Reorder.Group
        axis="y"
        values={ids}
        onReorder={arrange}
        aria-label={`Level ${level} passages, in the order learners see them`}
        className="flex flex-col gap-2"
      >
        {ids.map((id, index) => {
          const passage = byId.get(id);
          if (!passage) return null;
          return (
            <OrderRow
              key={id}
              passage={passage}
              position={index + 1}
              count={ids.length}
              busy={isPending}
              onMove={(by) => move(index, by)}
              onDrop={save}
            />
          );
        })}
      </Reorder.Group>
      <p
        role={note?.kind === "error" ? "alert" : "status"}
        className={cn(
          "min-h-5 text-sm",
          note?.kind === "error" ? "text-danger" : "text-muted-foreground",
        )}
      >
        {isPending ? "Saving the new order…" : (note?.text ?? "")}
      </p>
    </div>
  );
}

/** "Order of the lessons": arrange the passages of each level the way learners should meet them. */
export function PassageOrder({ passages }: { passages: AdminPassageRow[] }) {
  const levels = PASSAGE_LEVELS.filter((level) =>
    passages.some((passage) => passage.level === level),
  );
  const [chosen, setChosen] = useState<PassageLevel | null>(null);
  const level = chosen && levels.includes(chosen) ? chosen : levels[0];
  if (!level) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Order of the lessons</CardTitle>
        <CardDescription>
          Learners meet each level&apos;s passages in this order — in the list, in &ldquo;Up
          next&rdquo; and in the suggestion after a passage — and the number on each card follows
          it. Drag a passage by its handle, or use the arrows; it is saved as soon as you let go.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div role="group" aria-label="Level" className="flex flex-wrap gap-2">
          {levels.map((option) => {
            const count = passages.filter((passage) => passage.level === option).length;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={option === level}
                onClick={() => setChosen(option)}
                className={cn(
                  "focus-visible:ring-primary rounded-full border px-4 py-1.5 text-sm font-medium outline-none focus-visible:ring-2",
                  option === level
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "hover:bg-muted",
                )}
              >
                {option} <span className="tabular-nums opacity-70">· {count}</span>
              </button>
            );
          })}
        </div>
        <LevelOrder
          key={level}
          level={level}
          passages={passages.filter((passage) => passage.level === level)}
        />
      </CardContent>
    </Card>
  );
}
