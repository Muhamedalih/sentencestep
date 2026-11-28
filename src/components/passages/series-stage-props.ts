/** What the server works out for the stages of «What happens next?» (see series-guess-load.ts). */

import type { SeasonPlace } from "@/components/passages/series-stage";
import type { SeriesGuess } from "@/data/passages/series-guesses";

export interface SeriesAsk {
  guess: SeriesGuess;
  place: SeasonPlace;
  question: string;
  questionSupport: string | null;
  tomorrow: boolean;
  canRemind: boolean;
  reminderSubject: string;
}

/** One guess with both its ends, for the admin's quick try. */
export interface SeriesPreview {
  ask: SeriesAsk;
  /** The season as the answering episode shows it. */
  place: SeasonPlace;
  line: string;
  lineSupport: string | null;
}

export interface PassageSeriesStages {
  /** The guess asked at the end of this episode. */
  after: SeriesAsk | null;
  /** The last episode's guess, opened in this one. */
  answers: { guess: SeriesGuess; place: SeasonPlace } | null;
  /** This episode is not open yet: its waiting screen is shown instead of the reader. */
  closed: SeriesAsk | null;
}
