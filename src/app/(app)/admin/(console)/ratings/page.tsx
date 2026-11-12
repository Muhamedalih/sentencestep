import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { RatingDisplaySeconds } from "@/components/admin/rating-display-seconds";
import { RatingPublicToggle } from "@/components/admin/rating-public-toggle";
import { RatingsDisplaySettings } from "@/components/admin/ratings-display-settings";
import { RatingsImportForm } from "@/components/admin/ratings-import-form";
import { RatingReplyForm } from "@/components/admin/rating-reply-form";
import { RatingStatusControl } from "@/components/admin/rating-status-control";
import {
  RATINGS_PAGE_SIZE,
  RATINGS_SECTIONS,
  parseRatingsFilter,
  ratingsFilterParams,
  type AppRatingStatus,
  type RatingsFilter,
} from "@/lib/admin/ratings-domain";
import {
  countAppRatingsBySection,
  countNewRatingsBySource,
  getAppRatingsOverview,
  listAppRatings,
} from "@/lib/admin/ratings-queries";
import { getRatingsSettings } from "@/lib/feedback/ratings-settings";
import { MIN_RATINGS_TO_QUOTE, buildRatingsProof } from "@/lib/stats/ratings-proof";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import { formatAdminDateTime } from "@/lib/admin/format-date-time";

export const metadata: Metadata = {
  title: "Ratings",
};

const STATUS_VARIANT: Record<AppRatingStatus, "secondary" | "outline" | "success" | "muted"> = {
  new: "secondary",
  read: "outline",
  replied: "success",
  archived: "muted",
};

const STARS = [1, 2, 3, 4, 5] as const;

/** The small tabs under App: where in the app a rating was given. */
const SECTION_LABEL: Record<(typeof RATINGS_SECTIONS)[number], string> = {
  all: "All",
  normal: "Daily lessons",
  stories: "Stories",
  settings: "Site (Settings)",
};

/** A link to this page with one part of the filter changed; the page number always restarts at 1. */
function hrefWith(filter: RatingsFilter, change: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...ratingsFilterParams(filter), ...change })) {
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  return qs ? `/admin/ratings?${qs}` : "/admin/ratings";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium",
        active ? "bg-muted" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {STARS.map((i) => (
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

export default async function AdminRatingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const filter = parseRatingsFilter(await searchParams);
  const [overview, { ratings, totalCount }, settings, newBySource, sectionCounts] =
    await Promise.all([
      getAppRatingsOverview(filter.source, filter.section),
      listAppRatings(filter),
      getRatingsSettings(),
      countNewRatingsBySource(),
      countAppRatingsBySection(),
    ]);
  const forPassages = filter.source === "passages";
  const forVideo = filter.source === "video";
  const forWords = filter.source === "words";
  const forRounds = filter.source === "rounds";
  // Passages, Video and Words are kept apart from the app's own ratings; a section of the App tab is
  // part of them (the site's average is made of every section together).
  const keptApart = forPassages || forVideo || forWords || forRounds;
  const wholeApp = filter.source === "app" && filter.section === "all";
  const biggestStar = Math.max(1, ...overview.perStar);
  const proof = buildRatingsProof(overview.perStar);
  const proofPreview = proof
    ? `“${proof.average.toFixed(1)} average from ${proof.count}+ ratings”`
    : `nothing yet — it needs at least ${MIN_RATINGS_TO_QUOTE} ratings (you have ${overview.count})`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          Ratings
          {overview.newCount > 0 && <Badge variant="secondary">{overview.newCount} new</Badge>}
        </h1>
        <p className="text-muted-foreground mt-1">
          {forPassages
            ? "What learners said about the Passages section, from the one-time card shown after their first finished passage (the passage is named on each rating), newest first. They are kept apart from the app's own ratings, so they never move the average quoted on the site. "
            : forRounds
              ? "What learners said about the word rounds of Word Lists, from the faces card shown after a finished round (a face is 5 stars for loved it down to 1 for hated it, with an optional comment). They are kept apart from the app's own ratings, so they never move the average quoted on the site. "
              : forWords
              ? "What learners said about My Words («كلماتي»), from the row of stars at the end of a words review. They are kept apart from the app's own ratings, so they never move the average quoted on the site. "
              : forVideo
                ? "What learners said about the Video section and how to develop the site, from the one-time card shown after their first finished video (the video is named on each rating), newest first. They are kept apart from the app's own ratings, so they never move the average quoted on the site. "
                : "What learners gave the app from the rating pop-up after a Daily lesson or a Story and from Settings, newest first. The tabs Daily lessons, Stories and Site look at one of those places at a time; together (App all) they make the average quoted on the site. "}
          Reply by email to anyone who left an address (signed-in members always have one), and
          approve the best ones to show on the site. Archiving a rating takes it out of the figures
          below
          {keptApart ? "" : " and out of the average quoted on the site"}. Times are Baghdad time
          (UTC+3), like the old sheet.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        <Chip href={hrefWith(filter, { source: undefined, section: undefined })} active={wholeApp}>
          App (all)
          {newBySource.app > 0 && (
            <Badge variant="secondary" className="ms-2">
              {newBySource.app} new
            </Badge>
          )}
        </Chip>
        {RATINGS_SECTIONS.filter((section) => section !== "all").map((section) => (
          <Chip
            key={section}
            href={hrefWith(filter, { source: undefined, section })}
            active={filter.source === "app" && filter.section === section}
          >
            {SECTION_LABEL[section]}
            <span className="text-muted-foreground ms-1.5 text-xs tabular-nums">
              {sectionCounts[section]}
            </span>
          </Chip>
        ))}
        <Chip
          href={hrefWith(filter, { source: "passages", section: undefined })}
          active={filter.source === "passages"}
        >
          Passages
          {newBySource.passages > 0 && (
            <Badge variant="secondary" className="ms-2">
              {newBySource.passages} new
            </Badge>
          )}
        </Chip>
        <Chip href={hrefWith(filter, { source: "video", section: undefined })} active={forVideo}>
          Video
          {newBySource.video > 0 && (
            <Badge variant="secondary" className="ms-2">
              {newBySource.video} new
            </Badge>
          )}
        </Chip>
        <Chip href={hrefWith(filter, { source: "words", section: undefined })} active={forWords}>
          Words
          {newBySource.words > 0 && (
            <Badge variant="secondary" className="ms-2">
              {newBySource.words} new
            </Badge>
          )}
        </Chip>
        <Chip href={hrefWith(filter, { source: "rounds", section: undefined })} active={forRounds}>
          Word rounds
          {newBySource.rounds > 0 && (
            <Badge variant="secondary" className="ms-2">
              {newBySource.rounds} new
            </Badge>
          )}
        </Chip>
      </div>

      {wholeApp && (
        <RatingsDisplaySettings
          initial={settings}
          proofPreview={proofPreview}
          approvedWithComment={overview.publicWithCommentCount}
        />
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <div className="grid grid-cols-2 gap-3">
          <div className="border-border rounded-xl border p-4">
            <p className="text-muted-foreground text-xs font-medium">Average</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {overview.average === null ? "—" : overview.average.toFixed(1)}
              <span className="text-muted-foreground text-base font-normal"> / 5</span>
            </p>
          </div>
          <div className="border-border rounded-xl border p-4">
            <p className="text-muted-foreground text-xs font-medium">Ratings</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{overview.count}</p>
          </div>
          <div className="border-border rounded-xl border p-4">
            <p className="text-muted-foreground text-xs font-medium">With a comment</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{overview.commentCount}</p>
          </div>
          <div className="border-border rounded-xl border p-4">
            <p className="text-muted-foreground text-xs font-medium">Shown on site</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{overview.publicCount}</p>
          </div>
        </div>

        <div className="border-border flex flex-col justify-center gap-2 rounded-xl border p-4">
          {[...STARS].reverse().map((star) => {
            const n = overview.perStar[star - 1]!;
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

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          <Chip href={hrefWith(filter, { view: undefined })} active={filter.view === "active"}>
            Ratings
          </Chip>
          <Chip href={hrefWith(filter, { view: "public" })} active={filter.view === "public"}>
            On site
          </Chip>
          <Chip href={hrefWith(filter, { view: "archived" })} active={filter.view === "archived"}>
            Archived
          </Chip>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <Chip href={hrefWith(filter, { stars: undefined })} active={filter.stars === null}>
              All stars
            </Chip>
            {[...STARS].reverse().map((star) => (
              <Chip
                key={star}
                href={hrefWith(filter, { stars: String(star) })}
                active={filter.stars === star}
              >
                {star} ★
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Chip href={hrefWith(filter, { type: undefined })} active={filter.userType === null}>
              Everyone
            </Chip>
            <Chip href={hrefWith(filter, { type: "member" })} active={filter.userType === "member"}>
              Members
            </Chip>
            <Chip href={hrefWith(filter, { type: "guest" })} active={filter.userType === "guest"}>
              Guests
            </Chip>
          </div>
          <Chip
            href={hrefWith(filter, { comments: filter.commentOnly ? undefined : "1" })}
            active={filter.commentOnly}
          >
            With a comment
          </Chip>
        </div>
      </div>

      {ratings.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-12 text-center text-sm">
          {filter.view === "public"
            ? "Nothing is shown on the site yet. Use “Show on site” on a rating you'd like to feature."
            : "No ratings match these filters."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ratings.map((rating) => (
            <div key={rating.id} className="border-border rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={rating.rating} />
                    <Badge variant={rating.userType === "member" ? "outline" : "muted"}>
                      {rating.userType === "member" ? "Member" : "Guest"}
                    </Badge>
                    <Badge variant={STATUS_VARIANT[rating.status]}>{rating.status}</Badge>
                    {rating.isPublic && <Badge variant="success">On site</Badge>}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatAdminDateTime(rating.createdAt)} · {rating.locale.toUpperCase()}
                    {rating.lessonId && (
                      <>
                        {" · "}
                        <code>{rating.lessonId}</code>
                        {rating.mode && rating.mode !== rating.lessonId ? ` (${rating.mode})` : ""}
                      </>
                    )}
                  </p>
                </div>
                <RatingStatusControl id={rating.id} status={rating.status} />
              </div>

              {rating.comment ? (
                <p dir="auto" className="mt-3 text-sm whitespace-pre-wrap">
                  {rating.comment}
                </p>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm italic">No comment.</p>
              )}

              <div className="mt-3 flex flex-wrap items-start gap-3">
                <RatingPublicToggle id={rating.id} isPublic={rating.isPublic} />
                {rating.isPublic && rating.comment && (
                  <RatingDisplaySeconds
                    id={rating.id}
                    comment={rating.comment}
                    initialSeconds={rating.displaySeconds}
                  />
                )}
                {rating.contactEmail ? (
                  <RatingReplyForm ratingId={rating.id} contactEmail={rating.contactEmail} />
                ) : (
                  <p className="text-muted-foreground self-center text-xs">
                    No email on this rating, so it can&apos;t be answered.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationControls
        page={filter.page}
        pageSize={RATINGS_PAGE_SIZE}
        totalCount={totalCount}
        basePath="/admin/ratings"
        searchParams={ratingsFilterParams(filter)}
      />

      <details className="border-border rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Import ratings from the old Google Sheet
        </summary>
        <div className="mt-4">
          <RatingsImportForm />
        </div>
      </details>
    </div>
  );
}
