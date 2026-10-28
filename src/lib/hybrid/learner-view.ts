import { cookies } from "next/headers";

/**
 * "See it as a learner" for an admin, on this browser: the admin's account otherwise sees every
 * lock open, so the taste of the day, the lock screens and the moments could never be checked on it.
 * With this cookie the admin's own Today, lock screens and moments follow a learner's rules. It only
 * ever takes access away from the browser that sets it, so no cookie value can widen anything.
 */
export const LEARNER_VIEW_COOKIE = "ss_learner_view";
export const LEARNER_VIEW_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function isLearnerViewOn(): Promise<boolean> {
  return (await cookies()).get(LEARNER_VIEW_COOKIE)?.value === "1";
}
