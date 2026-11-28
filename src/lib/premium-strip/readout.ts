/**
 * What the people who pressed Home's Premium strip did afterwards. Pure: the rows are read by
 * src/lib/admin/premium-strip-queries.ts.
 */

/** Only what happened in this long after a person's first press is credited to it. */
export const STRIP_FOLLOW_DAYS = 7;

/** Events that mean the person went back to practising. */
export const PRACTICE_EVENTS = [
  "LESSON_STARTED",
  "STORY_STARTED",
  "CONVERSATION_STARTED",
  "LESSON_COMPLETED",
  "STORY_COMPLETED",
  "CONVERSATION_COMPLETED",
  "WORDS_ROUND_STARTED",
  "SENTENCE_REVIEW_STARTED",
  "VIDEO_STARTED",
] as const;

export const PAY_PRESS_EVENT = "UPGRADE_CTA_CLICKED";

export interface StripPress {
  userId: string | null;
  at: string;
  country: string | null;
}

export interface StripLaterEvent {
  userId: string;
  name: string;
  at: string;
  plan?: string | null;
  method?: string | null;
}

export interface StripOrder {
  userId: string;
  at: string;
  status: string;
}

/** The furthest each person got, best first. */
export type StripOutcome = "paid" | "pay_pressed" | "practised" | "nothing";

export interface StripPerson {
  userId: string;
  firstPressAt: string;
  presses: number;
  country: string | null;
  outcome: StripOutcome;
  /** The plan and way to pay of their latest pay press, when they made one. */
  plan: string | null;
  method: string | null;
}

export interface StripReadout {
  /** Every press, by members and guests (admins and editors left out). */
  presses: number;
  guestPresses: number;
  /** Signed-in people who pressed at least once. */
  people: StripPerson[];
  outcomes: Record<StripOutcome, number>;
  /** Presses by admins and editors, counted apart so a test press can be seen to arrive. */
  staffPresses: number;
}

export function summarizeStrip(input: {
  presses: StripPress[];
  events: StripLaterEvent[];
  orders: StripOrder[];
  staffIds: ReadonlySet<string>;
}): StripReadout {
  const real = input.presses.filter((press) => !press.userId || !input.staffIds.has(press.userId));
  const byUser = new Map<string, StripPress[]>();
  for (const press of real) {
    if (!press.userId) continue;
    const list = byUser.get(press.userId);
    if (list) list.push(press);
    else byUser.set(press.userId, [press]);
  }

  const people: StripPerson[] = [...byUser].map(([userId, presses]) => {
    const sorted = [...presses].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const from = Date.parse(sorted[0]!.at);
    const until = from + STRIP_FOLLOW_DAYS * 24 * 60 * 60 * 1000;
    const followed = (row: { userId: string; at: string }) =>
      row.userId === userId && Date.parse(row.at) >= from && Date.parse(row.at) <= until;

    const events = input.events.filter(followed);
    const orders = input.orders.filter(followed);
    const payPresses = events
      .filter((event) => event.name === PAY_PRESS_EVENT)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const outcome: StripOutcome = orders.some((order) => order.status === "fulfilled")
      ? "paid"
      : payPresses.length > 0 || orders.length > 0
        ? "pay_pressed"
        : events.some((event) => (PRACTICE_EVENTS as readonly string[]).includes(event.name))
          ? "practised"
          : "nothing";

    return {
      userId,
      firstPressAt: sorted[0]!.at,
      presses: sorted.length,
      country: sorted.find((press) => press.country)?.country ?? null,
      outcome,
      plan: payPresses[0]?.plan ?? null,
      method: payPresses[0]?.method ?? null,
    };
  });
  people.sort((a, b) => Date.parse(b.firstPressAt) - Date.parse(a.firstPressAt));

  const outcomes: Record<StripOutcome, number> = {
    paid: 0,
    pay_pressed: 0,
    practised: 0,
    nothing: 0,
  };
  for (const person of people) outcomes[person.outcome] += 1;

  return {
    presses: real.length,
    guestPresses: real.filter((press) => !press.userId).length,
    people,
    outcomes,
    staffPresses: input.presses.length - real.length,
  };
}
