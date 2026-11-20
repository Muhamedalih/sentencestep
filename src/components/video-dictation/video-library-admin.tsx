"use client";

import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { DragEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/content-actions";
import type { SupportLocale } from "@/lib/i18n/locales";
import {
  homeKind,
  moveVideo,
  sameIds,
  sameSections,
  shiftSection,
  shiftVideo,
  withoutVideo,
} from "@/lib/video-dictation/arrange";
import type { VideoSection } from "@/lib/video-dictation/arrange";
import {
  resetVideoArrangementAction,
  saveVideoArrangementAction,
} from "@/lib/video-dictation/arrangement-actions";
import type { VideoCardData } from "@/lib/video-dictation/content";
import { thumbnailUrl } from "@/lib/video-dictation/format";
import { fill, videoStrings } from "@/lib/video-dictation/strings";
import type { VideoStrings } from "@/lib/video-dictation/strings";
import { VIDEO_KINDS } from "@/lib/video-dictation/types";
import type { VideoKind } from "@/lib/video-dictation/types";
import { cn } from "@/lib/utils";

import { VideoCard } from "./video-card";
import { LibraryHeader, SectionBlock, VideoGrid } from "./video-library-parts";
import { ShelvesLibrary } from "./video-shelves";

type Message = { kind: "success" | "error"; text: string };

/** Where a dragged video would land: the section, and its place among that section's OTHER videos. */
interface DropAt {
  kind: VideoKind;
  index: number;
}

/**
 * The library as an Admin sees it: the same sections and cards as the learners' page, plus an arrange
 * mode («ترتيب الفيديوهات»). In it every video is a row that can be dragged (or moved with the arrows)
 * inside its section, moved to another section from its list, and every section can move up or down;
 * «حفظ الترتيب» stores the result for everyone (saveVideoArrangementAction, Admin-only again on the
 * server), «العودة للترتيب الافتراضي» deletes it. The trash button of a row deletes the video once the
 * arrangement is saved: it moves to a list of deleted videos at the bottom, where «استرجاع» puts it back
 * into its section, and «إلغاء» undoes all of it (the video file stays in the code, so a deleted video can
 * always come back). Only this component and its two server actions know about arranging: the page hands
 * it the sections already arranged, the videos already deleted, the default arrangement (what a reset
 * goes back to) and slim card data, never the videos' sentences.
 */
interface LibraryProps {
  sections: readonly VideoSection[];
  defaultSections: readonly VideoSection[];
  /** The videos an Admin deleted earlier: in no section, shown only in the arrange mode (to restore). */
  removed?: readonly string[];
  cards: Readonly<Record<string, VideoCardData>>;
  locale: SupportLocale | null;
  /** The "videoShelves" permission: the shelves look, and its section names in the arrange mode too. */
  shelves?: boolean;
  /** The "videoHeader" permission: the header with a mini player (only in the shelves look). */
  playerHeader?: boolean;
}

/** What the arrange mode asks of the server (both are Admin-only there): kept apart so the screen can be tried without a database. */
export interface ArrangeActions {
  save: (input: { sections: VideoSection[]; removed: string[] }) => Promise<ActionResult>;
  reset: () => Promise<ActionResult>;
}

/** The Admin's library, wired to the real server actions. */
export function VideoLibraryAdmin(props: LibraryProps) {
  return (
    <VideoLibraryArranger
      {...props}
      actions={{ save: saveVideoArrangementAction, reset: resetVideoArrangementAction }}
    />
  );
}

export function VideoLibraryArranger({
  sections,
  defaultSections,
  removed = [],
  cards,
  locale,
  shelves = false,
  playerHeader = false,
  actions,
}: LibraryProps & { actions: ArrangeActions }) {
  const strings = videoStrings(locale);
  const kindName = (kind: VideoKind) =>
    shelves ? strings.shelfKinds[kind].name : strings.kinds[kind];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [arranging, setArranging] = useState(false);
  const [draft, setDraft] = useState<VideoSection[]>([]);
  const [removedDraft, setRemovedDraft] = useState<string[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  // The video being dragged: the ref is known the instant the drag starts (the drop handlers read it), the
  // state follows a moment later to dim the row without disturbing the drag image.
  const dragRef = useRef<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<DropAt | null>(null);
  // What was just saved (or reset to), shown until the page's own fresh copy arrives: it is told apart
  // from a newer one by the `sections` list it was made for, so no effect is needed to clear it.
  const [saved, setSaved] = useState<{
    base: readonly VideoSection[];
    value: readonly VideoSection[];
    removed: readonly string[];
  } | null>(null);

  const current = saved && saved.base === sections ? saved : null;
  const shown = current ? current.value : sections;
  const shownRemoved = current ? current.removed : removed;
  const changed = !sameSections(draft, shown) || !sameIds(removedDraft, shownRemoved);

  function startArranging() {
    setDraft(shown.map((section) => ({ kind: section.kind, ids: [...section.ids] })));
    setRemovedDraft([...shownRemoved]);
    setMessage(null);
    setArranging(true);
  }

  function endDrag() {
    dragRef.current = null;
    setDragId(null);
    setDropAt(null);
  }

  function startDrag(id: string) {
    dragRef.current = id;
    window.setTimeout(() => {
      if (dragRef.current === id) setDragId(id);
    }, 0);
  }

  function stopArranging() {
    setArranging(false);
    endDrag();
  }

  /** Runs one of the two server actions; a request that fails on the way (no network) shows the same failure message as a refusal. */
  function run(
    action: () => Promise<ActionResult>,
    after: { sections: readonly VideoSection[]; removed: readonly string[] },
    done: string,
  ) {
    startTransition(async () => {
      let result: ActionResult;
      try {
        result = await action();
      } catch {
        result = { error: strings.arrangeFailed };
      }
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setSaved({ base: sections, value: after.sections, removed: after.removed });
      setMessage({ kind: "success", text: result.success ?? done });
      stopArranging();
      router.refresh();
    });
  }

  function save() {
    run(
      () => actions.save({ sections: draft, removed: removedDraft }),
      { sections: draft, removed: removedDraft },
      strings.arrangeSaved,
    );
  }

  function reset() {
    if (!window.confirm(strings.arrangeResetConfirm)) return;
    // The order goes back to the default; the deleted videos stay deleted (and out of the sections).
    const kept = defaultSections.map((section) => ({
      kind: section.kind,
      ids: section.ids.filter((id) => !shownRemoved.includes(id)),
    }));
    run(() => actions.reset(), { sections: kept, removed: shownRemoved }, strings.arrangeResetDone);
  }

  function removeVideo(id: string) {
    setDraft((current) => withoutVideo(current, id));
    setRemovedDraft((current) => (current.includes(id) ? current : [...current, id]));
  }

  function restoreVideo(id: string) {
    setDraft((current) => moveVideo(current, id, homeKind(defaultSections, id)));
    setRemovedDraft((current) => current.filter((candidate) => candidate !== id));
  }

  function onDragOverSection(event: DragEvent<HTMLElement>, kind: VideoKind) {
    const moving = dragRef.current;
    if (!moving) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    // The place among the section's other videos: before the first row whose middle is below the pointer.
    const rows = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-video-row]"));
    const others = rows.filter((row) => row.dataset.videoRow !== moving);
    let index = others.length;
    for (let position = 0; position < others.length; position += 1) {
      const rect = (others[position] as HTMLElement).getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) {
        index = position;
        break;
      }
    }
    setDropAt((current) =>
      current && current.kind === kind && current.index === index ? current : { kind, index },
    );
  }

  function onDropSection(event: DragEvent<HTMLElement>, kind: VideoKind) {
    event.preventDefault();
    const moving = dragRef.current;
    if (moving && dropAt && dropAt.kind === kind) {
      setDraft((current) => moveVideo(current, moving, kind, dropAt.index));
    }
    endDrag();
  }

  const arrangeButton = (
    <Button variant="outline" size="sm" className="max-sm:w-full" onClick={startArranging}>
      <ArrowUpDown aria-hidden="true" />
      <span dir="auto">{strings.arrange}</span>
    </Button>
  );

  if (!arranging && shelves) {
    return (
      <ShelvesLibrary
        sections={shown}
        cards={cards}
        strings={strings}
        action={arrangeButton}
        playerHeader={playerHeader}
        status={message && <StatusLine message={message} className="-mt-2 mb-6" />}
      />
    );
  }

  if (!arranging) {
    const visible = shown.filter((section) => section.ids.length > 0);
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <LibraryHeader strings={strings} action={arrangeButton} />
        {message && <StatusLine message={message} className="-mt-2 mb-6" />}
        {visible.length === 0 ? (
          <p className="text-muted-foreground" dir="auto">
            {strings.libraryEmpty}
          </p>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            {visible.map((section) => (
              <SectionBlock
                key={section.kind}
                title={kindName(section.kind)}
                count={section.ids.length}
              >
                <VideoGrid>
                  {section.ids.map((id) => {
                    const card = cards[id];
                    return card ? (
                      <li key={id} className="flex">
                        <VideoCard card={card} strings={strings} />
                      </li>
                    ) : null;
                  })}
                </VideoGrid>
              </SectionBlock>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="border-border/60 bg-background/90 sticky top-16 z-40 -mx-4 -mt-8 mb-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2" dir="rtl">
          <Button size="sm" onClick={save} disabled={pending || !changed}>
            <Check aria-hidden="true" />
            <span dir="auto">{pending ? strings.arrangeSaving : strings.arrangeSave}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={stopArranging} disabled={pending}>
            <span dir="auto">{strings.arrangeCancel}</span>
          </Button>
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="text-muted-foreground hover:text-foreground px-2 text-[13px] underline underline-offset-4 transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            <span dir="auto">{strings.arrangeReset}</span>
          </button>
        </div>
        <p className="text-muted-foreground text-sm" dir="auto">
          {strings.arrangeHint}
        </p>
        {message && <StatusLine message={message} className="basis-full" />}
      </div>
      <LibraryHeader strings={strings} />
      <div className="space-y-8 sm:space-y-10">
        {draft.map((section, sectionIndex) => (
          <SectionBlock
            key={section.kind}
            title={kindName(section.kind)}
            count={section.ids.length}
            actions={
              <div className="flex gap-1.5">
                <ArrowButton
                  direction="up"
                  label={`${strings.moveSectionUp}: ${kindName(section.kind)}`}
                  disabled={sectionIndex === 0}
                  onClick={() => setDraft((current) => shiftSection(current, section.kind, -1))}
                />
                <ArrowButton
                  direction="down"
                  label={`${strings.moveSectionDown}: ${kindName(section.kind)}`}
                  disabled={sectionIndex === draft.length - 1}
                  onClick={() => setDraft((current) => shiftSection(current, section.kind, 1))}
                />
              </div>
            }
          >
            <div
              className="relative flex flex-col gap-2"
              onDragOver={(event) => onDragOverSection(event, section.kind)}
              onDrop={(event) => onDropSection(event, section.kind)}
            >
              {section.ids.length === 0 && (
                <div
                  className={cn(
                    "text-muted-foreground rounded-lg border border-dashed px-4 py-[18px] text-center text-sm transition-colors",
                    dropAt?.kind === section.kind && "border-primary/60 bg-brand-muted/30",
                  )}
                  dir="auto"
                >
                  {strings.arrangeEmptySection}
                </div>
              )}
              {renderRows(section, cards, strings, kindName, dragId, dropAt, {
                onDragStart: startDrag,
                onDragEnd: endDrag,
                onShift: (id, delta) => setDraft((current) => shiftVideo(current, id, delta)),
                onMoveTo: (id, kind) => setDraft((current) => moveVideo(current, id, kind)),
                onRemove: removeVideo,
              })}
            </div>
          </SectionBlock>
        ))}
        {removedDraft.length > 0 && (
          <SectionBlock title={strings.removedTitle} count={removedDraft.length}>
            <p className="text-muted-foreground -mt-1 mb-3 text-sm" dir="auto">
              {strings.removedHint}
            </p>
            <div className="flex flex-col gap-2">
              {removedDraft.map((id) => {
                const card = cards[id];
                return card ? (
                  <RemovedRow key={id} card={card} strings={strings} onRestore={restoreVideo} />
                ) : null;
              })}
            </div>
          </SectionBlock>
        )}
      </div>
    </div>
  );
}

interface RowHandlers {
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onShift: (id: string, delta: -1 | 1) => void;
  onMoveTo: (id: string, kind: VideoKind) => void;
  onRemove: (id: string) => void;
}

/** The rows of one section, with the drop line where a dragged video would land. */
function renderRows(
  section: VideoSection,
  cards: Readonly<Record<string, VideoCardData>>,
  strings: VideoStrings,
  kindName: (kind: VideoKind) => string,
  dragId: string | null,
  dropAt: DropAt | null,
  handlers: RowHandlers,
) {
  const items: ReactNode[] = [];
  let others = 0;
  section.ids.forEach((id, position) => {
    const card = cards[id];
    if (!card) return;
    const dragging = dragId === id;
    if (!dragging) {
      if (dropAt?.kind === section.kind && dropAt.index === others) {
        items.push(<DropLine key={`drop-${others}`} />);
      }
      others += 1;
    }
    items.push(
      <ArrangeRow
        key={id}
        card={card}
        strings={strings}
        kindName={kindName}
        kind={section.kind}
        first={position === 0}
        last={position === section.ids.length - 1}
        dragging={dragging}
        handlers={handlers}
      />,
    );
  });
  if (dropAt?.kind === section.kind && dropAt.index === others && dragId) {
    items.push(<DropLine key="drop-end" />);
  }
  return items;
}

function DropLine() {
  return (
    <div aria-hidden="true" className="relative -my-1 h-0">
      <span className="bg-primary absolute inset-x-0 -top-px h-0.5 rounded-full" />
      <span className="bg-primary absolute -top-1 -left-0.5 size-2 rounded-full" />
    </div>
  );
}

function ArrangeRow({
  card,
  strings,
  kindName,
  kind,
  first,
  last,
  dragging,
  handlers,
}: {
  card: VideoCardData;
  strings: VideoStrings;
  kindName: (kind: VideoKind) => string;
  kind: VideoKind;
  first: boolean;
  last: boolean;
  dragging: boolean;
  handlers: RowHandlers;
}) {
  return (
    <div
      data-video-row={card.id}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        // Firefox starts a drag only when some data is set.
        event.dataTransfer.setData("text/plain", card.id);
        handlers.onDragStart(card.id);
      }}
      onDragEnd={handlers.onDragEnd}
      className={cn(
        "border-border bg-card flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border py-2 pr-3 pl-2 transition-opacity",
        dragging && "opacity-40",
      )}
      dir="ltr"
    >
      <span
        aria-hidden="true"
        className="text-muted-foreground flex h-8 w-6 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
      >
        <GripVertical className="size-[18px]" />
      </span>
      <div className="bg-muted aspect-video w-24 shrink-0 overflow-hidden rounded-[8px] max-sm:w-20">
        {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail, served by YouTube and never stored here */}
        <img
          src={thumbnailUrl(card.youtubeId)}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-[15px] leading-5 font-semibold">{card.title}</p>
        <p className="text-muted-foreground truncate text-[13px] leading-[18px]">{card.channel}</p>
      </div>
      <span className="bg-brand-muted rounded-full px-2 py-0.5 text-xs font-semibold">
        {card.level}
      </span>
      <label className="relative inline-flex">
        <span className="sr-only">{fill(strings.sectionOf, { title: card.title })}</span>
        <select
          value={kind}
          onChange={(event) => handlers.onMoveTo(card.id, event.target.value as VideoKind)}
          dir="rtl"
          className="border-border bg-muted focus-visible:ring-ring h-8 min-w-32 cursor-pointer appearance-none rounded-[10px] border pr-3 pl-8 text-[13px] font-medium outline-none focus-visible:ring-2"
        >
          {VIDEO_KINDS.map((option) => (
            <option key={option} value={option}>
              {kindName(option)}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
        />
      </label>
      <div className="flex gap-1.5">
        <ArrowButton
          direction="up"
          label={`${strings.moveUp}: ${card.title}`}
          disabled={first}
          onClick={() => handlers.onShift(card.id, -1)}
        />
        <ArrowButton
          direction="down"
          label={`${strings.moveDown}: ${card.title}`}
          disabled={last}
          onClick={() => handlers.onShift(card.id, 1)}
        />
        <button
          type="button"
          aria-label={`${strings.removeVideo}: ${card.title}`}
          title={strings.removeVideo}
          onClick={() => handlers.onRemove(card.id)}
          className="border-border text-muted-foreground hover:border-danger/50 hover:bg-danger/10 hover:text-danger focus-visible:ring-ring flex size-8 items-center justify-center rounded-[10px] border transition-colors outline-none focus-visible:ring-2 pointer-coarse:size-11"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** A deleted video in the arrange mode: dimmed, with the button that puts it back. */
function RemovedRow({
  card,
  strings,
  onRestore,
}: {
  card: VideoCardData;
  strings: VideoStrings;
  onRestore: (id: string) => void;
}) {
  return (
    <div
      data-removed-row={card.id}
      className="border-border bg-card flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-dashed py-2 pr-3 pl-2"
      dir="ltr"
    >
      <div className="bg-muted aspect-video w-24 shrink-0 overflow-hidden rounded-[8px] opacity-50 max-sm:w-20">
        {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail, served by YouTube and never stored here */}
        <img
          src={thumbnailUrl(card.youtubeId)}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 basis-40 opacity-70">
        <p className="truncate text-[15px] leading-5 font-semibold">{card.title}</p>
        <p className="text-muted-foreground truncate text-[13px] leading-[18px]">{card.channel}</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => onRestore(card.id)}>
        <RotateCcw aria-hidden="true" />
        <span dir="auto">{strings.restoreVideo}</span>
      </Button>
    </div>
  );
}

function ArrowButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-8 items-center justify-center rounded-[10px] border transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-35 pointer-coarse:size-11"
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}

function StatusLine({ message, className }: { message: Message; className?: string }) {
  return (
    <p
      role="status"
      dir="auto"
      className={cn(
        "text-sm",
        message.kind === "error" ? "text-danger" : "text-success",
        className,
      )}
    >
      {message.text}
    </p>
  );
}
