"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type SettingsTab = {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
  tone?: "danger";
};

export function SettingsTabs({
  tabs,
  defaultTab,
}: {
  tabs: [SettingsTab, ...SettingsTab[]];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0].id);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
      <nav className="border-border flex gap-1 overflow-x-auto border-b pb-2 md:w-64 md:shrink-0 md:flex-col md:border-e md:border-b-0 md:pe-7 md:pb-0">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors md:gap-3 md:px-5 md:py-3.5 md:text-lg",
                tab.tone === "danger"
                  ? isActive
                    ? "bg-danger/10 text-danger"
                    : "text-danger/70 hover:bg-danger/5 hover:text-danger"
                  : isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="[&_svg]:size-4 md:[&_svg]:size-5" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1">
        {tabs.map((tab) => (
          <div key={tab.id} hidden={tab.id !== active} className="flex flex-col gap-6">
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
