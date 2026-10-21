/** What a learner can do on the new lesson ending (see src/components/learning/session-end.tsx); each one is reported as SESSION_END_ACTION. */
export const SESSION_END_ACTIONS = [
  "extra_lesson",
  "locked_lesson",
  "finish",
  "save_google",
  "save_email",
  "not_now",
  "reminder_set",
  "reminder_none",
] as const;

export type SessionEndAction = (typeof SESSION_END_ACTIONS)[number];

export function isSessionEndAction(value: unknown): value is SessionEndAction {
  return SESSION_END_ACTIONS.some((action) => action === value);
}
