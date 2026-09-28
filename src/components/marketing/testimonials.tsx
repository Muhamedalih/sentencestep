import { Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import { fetchPublishedTestimonials } from "@/lib/supabase/queries/testimonials";
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import { cn } from "@/lib/utils";

/**
 * Real learner quotes, sourced from RatingModal's own "show my review on the
 * homepage" consent checkbox and approved by an admin (see Admin >
 * Testimonials) — never invented copy. An async Server Component nested
 * inside HomePageContent's otherwise-static tree; fetchPublishedTestimonials
 * uses the anonymous public client (no cookies), so this stays as
 * build/ISR-friendly as the rest of the homepage — a publish/dismiss in the
 * admin just calls revalidatePath("/") to pick up the change. Renders
 * nothing at all rather than an empty section when no testimonial has been
 * approved yet.
 */
export async function Testimonials({ t }: { t: Dictionary }) {
  const testimonials = await fetchPublishedTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.marketing.testimonialsHeading}
        </h2>
        <p className="text-muted-foreground mt-3 text-lg text-balance">
          {t.marketing.testimonialsSubtitle}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <Card key={item.id} className="gap-3 rounded-2xl p-6 text-start">
            <div className="flex gap-0.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-4",
                    i <= item.rating
                      ? "fill-current text-[var(--lesson-xp)]"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
            <p className="text-foreground text-sm leading-relaxed">&ldquo;{item.comment}&rdquo;</p>
            {item.displayName && (
              <p className="text-muted-foreground text-xs font-semibold">{item.displayName}</p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
