import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { getGermanCounter } from "@/lib/admin/german-counter-queries";
import { formatAdminDateTime } from "@/lib/admin/format-date-time";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "German",
};

function Figure({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="border-border rounded-xl border p-4">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {note && <p className="text-muted-foreground mt-1 text-xs">{note}</p>}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            "size-4",
            i <= value ? "text-primary fill-primary" : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

/** A share as "62%", or a dash when there is nothing to divide by. */
function percent(part: number, whole: number): string {
  return whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`;
}

export default async function AdminGermanPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const counter = await getGermanCounter();
  const { choices, activity, members, ratings } = counter;
  const biggestDay = Math.max(1, ...choices.perDay.map((day) => day.people));
  const biggestStar = Math.max(1, ...ratings.perStar);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">German</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          The people who chose German as the language to learn, and how they reacted. Every figure
          leaves out admins and editors. A choice is counted once per person (their account, or
          else their browser), the first time they switch to German.
          {counter.countingSince
            ? ` Counting since ${formatAdminDateTime(counter.countingSince)} (Baghdad time).`
            : " Nobody has chosen German since the counter started."}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Who chose German</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Figure label="People who chose German" value={choices.people} />
          <Figure label="Today" value={choices.peopleToday} note="Baghdad day" />
          <Figure label="Last 7 days" value={choices.peopleLast7Days} />
          <Figure
            label="Chose it on the first screen"
            value={choices.firstRunPeople}
            note={`${choices.laterPeople} switched to it later, from the top bar or the strip`}
          />
        </div>
        <div className="border-border rounded-xl border p-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium">
            New people per day, last 14 days
          </p>
          <div className="flex flex-col gap-1.5">
            {choices.perDay.map((day) => (
              <div key={day.day} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-24 shrink-0 tabular-nums">{day.day}</span>
                <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(day.people / biggestDay) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums">{day.people}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          {choices.switches} switches to German in all
          {choices.switches > choices.people ? " (some people switched more than once)" : ""}.
          Accounts that have German as their language right now: {members.onGerman} (
          {members.newLast7Days} created in the last 7 days). That number also includes members who
          chose it before this counter existed.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">What they did</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Figure
            label="German lessons started"
            value={activity.started}
            note={`${activity.membersStarted} members, ${activity.guestStarted} by guests`}
          />
          <Figure
            label="German lessons finished"
            value={activity.finished}
            note={`${activity.membersFinished} members, ${activity.guestFinished} by guests`}
          />
          <Figure
            label="Finished / started"
            value={percent(activity.finished, activity.started)}
            note="Lessons, stories and conversations together"
          />
          <Figure
            label="Members who finished one"
            value={percent(activity.membersFinished, activity.membersStarted)}
            note={`of the ${activity.membersStarted} members who started one`}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">How they rated it</h2>
          <Link
            href="/admin/ratings?lang=de"
            className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
          >
            Open the German ratings →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
          <div className="grid grid-cols-2 gap-3">
            <Figure
              label="Average"
              value={ratings.average === null ? "—" : `${ratings.average.toFixed(1)} / 5`}
            />
            <Figure label="Ratings" value={ratings.count} />
            <Figure label="With a comment" value={ratings.withComment} />
          </div>
          <div className="border-border flex flex-col justify-center gap-2 rounded-xl border p-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = ratings.perStar[star - 1]!;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-9 shrink-0 tabular-nums">{star} ★</span>
                  <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${(n / biggestStar) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-10 shrink-0 text-right tabular-nums">
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {counter.latestComments.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs font-medium">Latest comments</p>
            {counter.latestComments.map((comment) => (
              <div key={comment.id} className="border-border rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={comment.rating} />
                  <span className="text-muted-foreground text-xs">
                    {formatAdminDateTime(comment.createdAt)} · <code>{comment.lessonId}</code>
                  </span>
                </div>
                <p dir="auto" className="mt-2 text-sm whitespace-pre-wrap">
                  {comment.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
