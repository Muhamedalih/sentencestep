import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { formatAdminDateTime } from "@/lib/admin/format-date-time";
import { getPremiumStripCounter } from "@/lib/admin/premium-strip-queries";
import { STRIP_FOLLOW_DAYS, type StripOutcome } from "@/lib/premium-strip/readout";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Premium strip",
};

const OUTCOME_LABELS: Record<StripOutcome, string> = {
  paid: "Paid",
  pay_pressed: "Pressed pay, not paid",
  practised: "Went back to practising",
  nothing: "Nothing since",
};
const OUTCOMES: StripOutcome[] = ["paid", "pay_pressed", "practised", "nothing"];

function Figure({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="border-border rounded-xl border p-4">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {note && <p className="text-muted-foreground mt-1 text-xs">{note}</p>}
    </div>
  );
}

export default async function AdminPremiumStripPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const counter = await getPremiumStripCounter();
  const members = counter.people.length;
  const share = (n: number) => (members === 0 ? "—" : `${Math.round((n / members) * 100)}%`);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Premium strip</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Who pressed the “Upgrade” button of the strip at the foot of Home, and what they did next.
          Admins and editors are left out.
          {counter.countingSince
            ? ` Counting since ${formatAdminDateTime(counter.countingSince)} (Baghdad time).`
            : " No press has been recorded yet."}
          {counter.staffPresses > 0
            ? ` Your own and editors’ presses, not counted below: ${counter.staffPresses}.`
            : ""}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Who pressed</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Figure label="Presses" value={counter.presses} note="Each opens the plans" />
          <Figure label="Members who pressed" value={members} note="Each counted once" />
          <Figure
            label="Presses by visitors without an account"
            value={counter.guestPresses}
            note="Presses, not people; what they did next cannot be followed"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">What members did next</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {OUTCOMES.map((outcome) => (
            <Figure
              key={outcome}
              label={OUTCOME_LABELS[outcome]}
              value={counter.outcomes[outcome]}
              note={`${share(counter.outcomes[outcome])} of members who pressed`}
            />
          ))}
        </div>
        <p className="text-muted-foreground max-w-3xl text-xs">
          Each person is in one box only, the furthest they got within {STRIP_FOLLOW_DAYS} days of
          their first press. “Practising” means a lesson, story, conversation, words round, sentence
          review or video (Passages are not recorded as events). A payment made later is credited to
          the strip even if something else also led to it.
        </p>
      </section>

      {members > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">The latest people</h2>
          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr className="border-border border-b">
                  <th className="px-4 py-2 font-medium">First press (Baghdad)</th>
                  <th className="px-4 py-2 font-medium">Account</th>
                  <th className="px-4 py-2 font-medium">Country</th>
                  <th className="px-4 py-2 font-medium">Presses</th>
                  <th className="px-4 py-2 font-medium">Next</th>
                  <th className="px-4 py-2 font-medium">Plan chosen</th>
                </tr>
              </thead>
              <tbody>
                {counter.people.slice(0, 50).map((person) => (
                  <tr key={person.userId} className="border-border/60 border-b last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatAdminDateTime(person.firstPressAt)}
                    </td>
                    <td className="px-4 py-2">{counter.emails.get(person.userId) ?? "—"}</td>
                    <td className="px-4 py-2 uppercase">{person.country ?? "—"}</td>
                    <td className="px-4 py-2 tabular-nums">{person.presses}</td>
                    <td className="px-4 py-2">{OUTCOME_LABELS[person.outcome]}</td>
                    <td className="px-4 py-2">
                      {person.plan
                        ? `${person.plan}${person.method ? ` · ${person.method}` : ""}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
