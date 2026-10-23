/**
 * Sentence bank: the day's exam. It asks about two things — what the learner finished TODAY (so the
 * day ends with proof that it was learned) and what they learned on earlier days (the honest test of
 * what stayed). Pure: the loader hands in both lists, already in the order each should be asked and
 * already limited to sentences that can really be asked, and this decides how many of each make the
 * exam and in what order.
 */

/**
 * The exam's sentences, today's first. About half come from the lessons finished today (rounded up:
 * a three-sentence exam asks two of them and one from before), the rest from earlier days, due ones
 * first — and when one side has too few the other fills the exam, so a learner on their first day
 * is asked only about today and one who finished nothing today only about before. With a single
 * sentence to ask, the earlier one wins (it is the one that cannot wait); fewer than `limit` come
 * back when fewer can be asked.
 */
export function composeExam<T>(args: {
  today: readonly T[];
  earlier: readonly T[];
  limit: number;
}): T[] {
  const limit = Math.max(0, Math.trunc(args.limit));
  if (limit === 0) return [];
  const wantedToday = limit === 1 ? 0 : Math.min(args.today.length, Math.ceil(limit / 2));
  const fromEarlier = args.earlier.slice(0, limit - wantedToday);
  const fromToday = args.today.slice(0, Math.min(args.today.length, limit - fromEarlier.length));
  return [...fromToday, ...fromEarlier];
}
