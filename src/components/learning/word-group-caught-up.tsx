"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { popIn } from "@/lib/motion";

/**
 * What a learner sees instead of a practice session when Smart word practice
 * finds nothing to ask in a group: every word is either not due yet or already
 * done. Not an error and not a dead end — it says when the next word falls due
 * and offers the old way of practicing the whole group anyway (a plain
 * `?scope=all` visit, which still records misses but leaves the schedule alone
 * for words that are not due).
 */
export function WordGroupCaughtUp({
  groupId,
  title,
  nextDueISO,
}: {
  groupId: string;
  title: string;
  /** The earliest day a word of this group falls due ("YYYY-MM-DD"), or null when none is scheduled. */
  nextDueISO: string | null;
}) {
  const { t, locale } = useLocale();
  const copy = t.wordLists.smart;

  // A date-only value parsed and formatted in the learner's own zone, so the
  // day shown is the day stored (no UTC shift can move it).
  const date = nextDueISO
    ? new Intl.DateTimeFormat(locale ?? "en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date(`${nextDueISO}T00:00:00`))
    : null;

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      className="border-border bg-card flex flex-col items-center gap-4 rounded-2xl border p-10 text-center shadow-sm sm:p-12"
    >
      <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
        <CheckCircle2 className="size-7" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.caughtUpHeading}</h1>
        <p className="text-muted-foreground mt-1" dir="ltr">
          {title}
        </p>
      </div>
      <p className="text-muted-foreground max-w-sm text-sm">
        {date ? copy.caughtUpBody.replace("{date}", date) : copy.caughtUpBodyNoDate}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/learn/word-lists">{t.wordLists.backToWordLists}</Link>
        </Button>
        <Button asChild>
          <Link href={`/learn/word-lists/${groupId}?scope=all`}>{copy.practiceAllAction}</Link>
        </Button>
      </div>
    </motion.div>
  );
}
