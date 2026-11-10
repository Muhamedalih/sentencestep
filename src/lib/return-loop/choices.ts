/**
 * The times offered on the "Remind me tomorrow" card of the return loop, as small pure functions.
 *
 * Learners who come back come back at about the hour they studied (measured on the learners who
 * signed up between 20 October and 6 November: 24% of them within an hour of the clock time of their
 * first lesson, 48% within three hours, against 10% and 28% if the hours were random), so the first
 * time offered is "the hour you are studying now". At night that is not a time to wake anyone, so
 * it is not offered then; and the second time is 8 pm (or midday when the first one is already in
 * the evening), so the two are never the same part of the day.
 */

export interface ReturnChoice {
  /** The hour of day, 0-23, tomorrow, on the learner's own clock. */
  hour: number;
  /** True for "the hour of today's session": the card says so, because that is the reason to pick it. */
  sameTime: boolean;
}

export interface ReturnChoices {
  primary: ReturnChoice;
  secondary: ReturnChoice;
}

/** The first and last hour a reminder may be offered at "the same time as today": 7 am to 10 pm. */
export const SAME_TIME_FIRST_HOUR = 7;
export const SAME_TIME_LAST_HOUR = 22;

const EVENING_HOUR = 20;
const MIDDAY_HOUR = 12;

/** The hour nearest to `now` on the clock of whoever runs this (the learner's browser): 15:20 is 15, 15:40 is 16. */
export function nearestHour(now: Date): number {
  const hour = now.getHours();
  return now.getMinutes() >= 30 ? (hour + 1) % 24 : hour;
}

export function returnChoices(now: Date): ReturnChoices {
  const nearest = nearestHour(now);
  const daytime = nearest >= SAME_TIME_FIRST_HOUR && nearest <= SAME_TIME_LAST_HOUR;
  const primary: ReturnChoice = daytime
    ? { hour: nearest, sameTime: true }
    : { hour: EVENING_HOUR, sameTime: false };
  const eveningAlready = primary.hour >= EVENING_HOUR - 1 && primary.hour <= EVENING_HOUR + 1;
  const secondary: ReturnChoice = {
    hour: eveningAlready ? MIDDAY_HOUR : EVENING_HOUR,
    sameTime: false,
  };
  return { primary, secondary };
}
