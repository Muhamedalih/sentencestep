"use client";

import Link from "next/link";
import { Keyboard } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { wordDropStrings } from "@/lib/word-drop/strings";
import { cn } from "@/lib/utils";

/**
 * Home's small door to Word Drop (the "wordDrop" permission, Admins only until it is opened): one row
 * in the game's own black, with its name, one line about it and a green-outlined button, under the
 * learner's lesson card. The page only draws it when the permission is open for the visitor.
 */
export function WordDropHomeCard({ className }: { className?: string }) {
  const { locale } = useLocale();
  const copy = wordDropStrings(locale);
  return (
    <Link
      href="/learn/word-drop"
      className={cn(
        "group focus-visible:ring-ring flex min-h-[4.25rem] items-center gap-4 rounded-2xl border border-[oklch(0.25_0_0)] bg-black px-4 py-3 text-white outline-none focus-visible:ring-2",
        className,
      )}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-[oklch(0.925_0.012_85)] text-[oklch(0.2_0.01_260)]"
        aria-hidden="true"
      >
        <Keyboard className="size-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1 text-left" dir="auto">
        <span className="block text-[15px] font-bold">{copy.navLabel}</span>
        <span className="block truncate text-[13px] text-[oklch(0.62_0.005_260)]">
          {copy.homeLine}
        </span>
      </span>
      <span className="shrink-0 rounded-xl border border-[oklch(0.72_0.19_150)] px-4 py-1.5 text-sm font-bold text-[oklch(0.72_0.19_150)] transition-colors group-hover:bg-[oklch(0.72_0.19_150)] group-hover:text-black">
        {copy.homeCta}
      </span>
    </Link>
  );
}
