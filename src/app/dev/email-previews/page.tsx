import { notFound } from "next/navigation";

import { milestoneEmail } from "@/lib/email/templates/milestone";
import { learningReminderEmail } from "@/lib/email/templates/reminder";
import { welcomeEmail } from "@/lib/email/templates/welcome";

/**
 * Renders the real templates with representative sample data — never real
 * user data, never sent anywhere. Not linked from any nav; 404s outside
 * development, matching the same gating pattern already used for the
 * /upgrade dev-tools panel and the dev-plan cookie (Milestone 6/8).
 */
export default function EmailPreviewsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const origin = "http://localhost:3000";
  const displayName = "Sara";

  const samples = [
    { label: "Welcome", content: welcomeEmail({ origin, displayName }) },
    {
      label: "Learning reminder",
      content: learningReminderEmail({ origin, displayName, daysInactive: 4 }),
    },
    {
      label: "Lesson milestone (5 lessons)",
      content: milestoneEmail({
        origin,
        displayName,
        event: { type: "LESSON_COMPLETED", totalCompleted: 5 },
      }),
    },
    {
      label: "Level completed",
      content: milestoneEmail({
        origin,
        displayName,
        event: { type: "LEVEL_COMPLETED", mode: "normal", level: 1 },
      }),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Email previews</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Development only — sample data, nothing here is sent. Not reachable in production.
      </p>

      <div className="mt-10 flex flex-col gap-12">
        {samples.map((sample) => (
          <section key={sample.label}>
            <h2 className="font-semibold tracking-tight">{sample.label}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Subject: <span className="text-foreground">{sample.content.subject}</span>
            </p>
            <iframe
              title={sample.label}
              srcDoc={sample.content.html}
              className="border-border mt-3 h-[520px] w-full max-w-[480px] rounded-2xl border"
            />
          </section>
        ))}
      </div>
    </div>
  );
}
