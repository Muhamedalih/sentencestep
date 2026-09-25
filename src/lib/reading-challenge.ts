// Community, Step 2 (competitor report Section 6.3) — a monthly reading
// challenge banner for the Library/Novels homepage. Pure and DB-free by
// design: the caller supplies how many books this learner has already
// completed since the start of the current calendar month (one cheap,
// indexed count query — see fetchCompletedBookCountThisMonth), and this
// module turns that into what the banner shows.

export const MONTHLY_READING_GOAL = 3;

export interface MonthlyReadingChallenge {
  completed: number;
  goal: number;
  isComplete: boolean;
}

export function computeMonthlyReadingChallenge(
  completedThisMonth: number,
  goal: number = MONTHLY_READING_GOAL,
): MonthlyReadingChallenge {
  return {
    completed: Math.min(completedThisMonth, goal),
    goal,
    isComplete: completedThisMonth >= goal,
  };
}
