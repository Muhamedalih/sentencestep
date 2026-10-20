import { placeFromHeaders } from "./visit-geo";
import {
  MAX_OPENS_PER_ORDER_PER_TEN_MINUTES,
  describeUserAgent,
  sanitizeActions,
  sanitizeLanguage,
  sanitizeLeaves,
  sanitizeTimeZone,
  sanitizeVisibleSeconds,
  sourceFromCookie,
} from "./visits";
import type { VisitDevice } from "./visits";

const MAX_REFERENCE_LENGTH = 255;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEN_MINUTES_MS = 10 * 60 * 1000;

/** A visit as it is first written: what the server can read from the request itself, plus the browser's own time zone and language. */
export interface NewVisit {
  orderId: string;
  userId: string;
  country: string | null;
  region: string | null;
  city: string | null;
  timeZone: string | null;
  language: string | null;
  device: VisitDevice | null;
  os: string | null;
  browser: string | null;
  source: string | null;
}

/** What a later "still here" report may change: the last-seen time, the two counters, and an action once it has happened. */
export interface VisitPatch {
  lastSeenAt: string;
  visibleSeconds?: number;
  leaves?: number;
  copiedId?: true;
  copiedCode?: true;
  openedGuide?: true;
}

export interface VisitDeps {
  getUser(): Promise<{ id: string } | null>;
  /** The learner's own Binance Pay order with this reference, or null. */
  findOrder(reference: string, userId: string): Promise<{ id: string } | null>;
  /** Visits opened for this order since then. */
  countRecentOpens(orderId: string, since: Date): Promise<number>;
  /** Null when the row could not be written. */
  insertVisit(visit: NewVisit): Promise<string | null>;
  /** Changes the learner's own visit; a visit that is not theirs, or not there, is left alone. */
  updateVisit(input: { visitId: string; userId: string; patch: VisitPatch }): Promise<void>;
  now?: () => Date;
}

export interface VisitRequest {
  /** The parsed JSON body (anything: it is client input). */
  body: unknown;
  headers: { get(name: string): string | null };
  /** The value of the first-touch cookie, if the browser sent one. */
  firstTouchCookie: string | null;
}

export type VisitResult =
  | { status: 200; body: { visitId: string } }
  | { status: 204 }
  | { status: 400 | 401 | 404 | 429 | 503 };

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * The two things the payment page's browser code says about a visit. With no
 * `visitId` it is "the instructions just appeared": a row is opened (the order
 * is looked up scoped to the signed-in learner, so nobody can add visits to
 * someone else's order) and its id goes back. With a `visitId` it is "still
 * here / leaving": the learner's own row is updated. Both are best-effort
 * telemetry for the admin, so a failure here never reaches the learner: the
 * payment page does not depend on any of it.
 */
export async function handleVisit(deps: VisitDeps, request: VisitRequest): Promise<VisitResult> {
  const user = await deps.getUser();
  if (!user) return { status: 401 };

  const body = asRecord(request.body);
  const now = (deps.now ?? (() => new Date()))();

  if (typeof body.visitId === "string") {
    if (!UUID_PATTERN.test(body.visitId)) return { status: 400 };
    const actions = sanitizeActions(body.actions);
    const patch: VisitPatch = { lastSeenAt: now.toISOString() };
    if (body.visibleSeconds !== undefined) {
      patch.visibleSeconds = sanitizeVisibleSeconds(body.visibleSeconds);
    }
    if (body.leaves !== undefined) patch.leaves = sanitizeLeaves(body.leaves);
    if (actions.includes("copy_id")) patch.copiedId = true;
    if (actions.includes("copy_code")) patch.copiedCode = true;
    if (actions.includes("guide")) patch.openedGuide = true;
    try {
      await deps.updateVisit({ visitId: body.visitId, userId: user.id, patch });
    } catch (error) {
      console.error("[binance] visit: could not update a visit", error);
      return { status: 503 };
    }
    return { status: 204 };
  }

  const reference = body.reference;
  if (
    typeof reference !== "string" ||
    reference === "" ||
    reference.length > MAX_REFERENCE_LENGTH
  ) {
    return { status: 400 };
  }

  try {
    const order = await deps.findOrder(reference, user.id);
    if (!order) return { status: 404 };

    const recent = await deps.countRecentOpens(order.id, new Date(now.getTime() - TEN_MINUTES_MS));
    if (recent >= MAX_OPENS_PER_ORDER_PER_TEN_MINUTES) return { status: 429 };

    const place = placeFromHeaders(request.headers);
    const device = describeUserAgent(request.headers.get("user-agent"));
    const visitId = await deps.insertVisit({
      orderId: order.id,
      userId: user.id,
      ...place,
      timeZone: sanitizeTimeZone(body.timeZone),
      language: sanitizeLanguage(body.language),
      ...device,
      source: sourceFromCookie(request.firstTouchCookie),
    });
    return visitId ? { status: 200, body: { visitId } } : { status: 503 };
  } catch (error) {
    console.error("[binance] visit: could not record a visit", error);
    return { status: 503 };
  }
}
