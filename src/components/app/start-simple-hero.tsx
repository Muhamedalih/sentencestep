import { Sparkles } from "lucide-react";

/**
 * The learner's first impression at the top of /learn — see the Phase 2
 * "Start Simple" redesign. Deliberately static/server-rendered (no client
 * interactivity needed) and restrained: one message, one visual moment, no
 * competing calls to action — the level previews and lesson cards right
 * below it are the actual next step, not a button here.
 */
export function StartSimpleHero() {
  return (
    <section className="border-border/60 from-brand-muted via-background to-background relative overflow-hidden rounded-2xl border bg-gradient-to-br px-6 py-11 text-center sm:py-14">
      <div
        aria-hidden="true"
        className="bg-brand/[0.07] absolute -top-14 -right-14 size-52 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-accent/10 absolute -bottom-16 -left-14 size-60 rounded-full blur-3xl"
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-3">
        <span className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Start Simple
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
          Learn English through real moments, not rules
        </h1>
        <p className="text-muted-foreground max-w-md text-base text-balance sm:text-lg">
          Short, interesting, real-life situations — typed sentence by sentence. No grammar drills,
          no chapters. Just English you&apos;ll actually use.
        </p>
      </div>
    </section>
  );
}
