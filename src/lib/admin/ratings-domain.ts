export type AppRatingStatus = "new" | "read" | "replied" | "archived";
export type RatingUserType = "member" | "guest";
/** "active" is everything not archived; "public" is what has been approved for the site. */
export type RatingsView = "active" | "archived" | "public";

export const APP_RATING_STATUSES: readonly AppRatingStatus[] = [
  "new",
  "read",
  "replied",
  "archived",
];

/** Ratings shown per page in Admin > Ratings. */
export const RATINGS_PAGE_SIZE = 25;

export interface RatingsFilter {
  view: RatingsView;
  /** Only this many stars, or null for all. */
  stars: 1 | 2 | 3 | 4 | 5 | null;
  userType: RatingUserType | null;
  /** Hide the ratings that came without a written comment. */
  commentOnly: boolean;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads Admin > Ratings' query string; anything unrecognised falls back to the default view. */
export function parseRatingsFilter(params: RawParams): RatingsFilter {
  const view = first(params.view);
  const stars = Number(first(params.stars));
  const userType = first(params.type);
  const page = Number(first(params.page));

  return {
    view: view === "archived" || view === "public" ? view : "active",
    stars:
      Number.isInteger(stars) && stars >= 1 && stars <= 5 ? (stars as 1 | 2 | 3 | 4 | 5) : null,
    userType: userType === "member" || userType === "guest" ? userType : null,
    commentOnly: first(params.comments) === "1",
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** The query-string form of a filter — what the page's links and pager keep when one part changes. */
export function ratingsFilterParams(filter: RatingsFilter): Record<string, string | undefined> {
  return {
    view: filter.view === "active" ? undefined : filter.view,
    stars: filter.stars ? String(filter.stars) : undefined,
    type: filter.userType ?? undefined,
    comments: filter.commentOnly ? "1" : undefined,
  };
}

export interface RatingsSummary {
  count: number;
  /** Mean out of 5 to one decimal, or null with no ratings. */
  average: number | null;
  /** Ratings per star, index 0 = 1 star ... index 4 = 5 stars. */
  perStar: [number, number, number, number, number];
}

/** Folds the per-star counts the database returns into the figures shown at the top of the page. */
export function summarizeDistribution(
  rows: readonly { rating: number; rating_count: number }[],
): RatingsSummary {
  const perStar: RatingsSummary["perStar"] = [0, 0, 0, 0, 0];
  for (const row of rows) {
    if (Number.isInteger(row.rating) && row.rating >= 1 && row.rating <= 5) {
      perStar[row.rating - 1]! += row.rating_count;
    }
  }
  const count = perStar.reduce((sum, n) => sum + n, 0);
  const total = perStar.reduce((sum, n, index) => sum + n * (index + 1), 0);
  return {
    count,
    average: count === 0 ? null : Math.round((total / count) * 10) / 10,
    perStar,
  };
}
