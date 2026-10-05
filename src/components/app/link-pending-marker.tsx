"use client";

import { useLinkStatus } from "next/link";

/**
 * Drop one inside a <Link> and style the Link off it: while that Link's
 * navigation is in flight (from the tap until the next page has rendered),
 * this renders `data-pending`, so the Link can light up with
 * `has-[[data-pending]]:…` classes the instant it is pressed.
 *
 * Why this exists: a tab/nav tap that has to wait on the server (not warmed
 * yet, a cold function, a slow query) otherwise gives no sign at all that the
 * press registered — the old page just sits there unchanged, which reads as a
 * dead or laggy button and invites a second tap. useLinkStatus is optimistic
 * (it flips on press, not on the response), but it can only be read from a
 * child of the Link, hence this marker rather than a hook on the Link itself.
 */
export function LinkPendingMarker() {
  const { pending } = useLinkStatus();
  return <span hidden data-pending={pending ? "" : undefined} />;
}
