"use client";

import { motion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import type { Difficulty } from "@/lib/levels";
import { TIER_TEXT_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";

export interface RuleLevelTab {
  /** The level's name ("A1", "A2–B1", "B2"): also what the tab is told apart by. */
  label: string;
  tier: Difficulty;
  /** How far the learner is on the level, as "14/45". */
  count: string;
  /** The level's units, drawn on the server: only the tab that is open is shown. */
  panel: ReactNode;
}

/**
 * The level tabs of the rule library, built like the Stories tabs: a row of names with an underline that
 * slides to the open one. The three levels' units come from the server already drawn, so changing tab only
 * shows another panel (nothing is fetched).
 */
export function RuleLevelTabs({
  tabs,
  initial,
  ariaLabel,
}: {
  tabs: readonly RuleLevelTab[];
  /** The tab that is open first: the level the course is on. */
  initial: string;
  ariaLabel: string;
}) {
  const [active, setActive] = useState(initial);
  const id = useId();
  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="border-border flex items-center gap-1 border-b sm:gap-[22px]"
      >
        {tabs.map((tab) => {
          const isActive = tab.label === active;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.label}`}
              aria-selected={isActive}
              aria-controls={`${id}-panel-${tab.label}`}
              onClick={() => setActive(tab.label)}
              className={cn(
                "focus-visible:ring-ring focus-visible:ring-offset-background relative flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-none sm:justify-start sm:py-3",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn("font-medium", TIER_TEXT_CLASS[tab.tier])} dir="ltr">
                {tab.label}
              </span>
              <span dir="ltr">· {tab.count}</span>
              {isActive && (
                <motion.span
                  layoutId={`${id}-underline`}
                  className="bg-foreground absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${id}-panel-${tab.label}`}
          aria-labelledby={`${id}-tab-${tab.label}`}
          hidden={tab.label !== active}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
