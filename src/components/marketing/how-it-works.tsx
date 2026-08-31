import { Ear, Keyboard, Repeat, TrendingUp } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionary/types";

export function HowItWorks({ t }: { t: Dictionary }) {
  const steps = [
    { icon: Ear, title: t.marketing.stepListenTitle, description: t.marketing.stepListenBody },
    { icon: Keyboard, title: t.marketing.stepTypeTitle, description: t.marketing.stepTypeBody },
    { icon: Repeat, title: t.marketing.stepRepeatTitle, description: t.marketing.stepRepeatBody },
    {
      icon: TrendingUp,
      title: t.marketing.stepProgressTitle,
      description: t.marketing.stepProgressBody,
    },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.marketing.howItWorksHeading}
        </h2>
        <p className="text-muted-foreground mt-3 text-lg text-balance">
          {t.marketing.howItWorksSubtitle}
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <div
            key={title}
            className="animate-rise-in flex flex-col gap-3 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-brand-muted text-primary flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <span className="text-muted-foreground text-sm font-medium">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-semibold tracking-tight">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
