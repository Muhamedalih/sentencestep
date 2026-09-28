import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { TestimonialStatusControl } from "@/components/admin/testimonial-status-control";
import { listTestimonials, type TestimonialStatus } from "@/lib/admin/testimonials-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Testimonials",
};

const STATUS_VARIANT: Record<TestimonialStatus, "secondary" | "success" | "muted"> = {
  pending: "secondary",
  published: "success",
  dismissed: "muted",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function stars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default async function AdminTestimonialsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const testimonials = await listTestimonials();
  const pendingCount = testimonials.filter((item) => item.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          Testimonials
          {pendingCount > 0 && <Badge variant="secondary">{pendingCount} pending</Badge>}
        </h1>
        <p className="text-muted-foreground mt-1">
          4-5 star ratings learners agreed to make public — publish the ones worth showing on the
          homepage.
        </p>
      </div>

      {testimonials.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-12 text-center text-sm">
          No testimonials yet — nothing submitted with consent to publish.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {testimonials.map((item) => (
            <div key={item.id} className="border-border rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.displayName ?? "Anonymous learner"}</span>
                    <span className="text-[var(--lesson-xp)]" aria-hidden="true">
                      {stars(item.rating)}
                    </span>
                    <Badge variant={STATUS_VARIANT[item.status]}>{item.status}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatDate(item.createdAt)}
                    {item.locale ? ` · ${item.locale}` : ""}
                  </p>
                </div>
                <TestimonialStatusControl id={item.id} status={item.status} />
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap">{item.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
