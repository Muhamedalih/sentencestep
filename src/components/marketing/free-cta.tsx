import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FreeCta() {
  return (
    <section id="free" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl px-8 py-14 text-center sm:px-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Try Looma before you commit
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-balance opacity-90">
          Free Normal, Stories, and Conversation lessons are unlocked from the start — no account
          required to get a feel for it.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" variant="secondary" className="text-foreground" asChild>
            <Link href="/learn">Start your first lesson</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
