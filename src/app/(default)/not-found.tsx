import { NotFoundContent } from "@/components/layout/not-found-content";

/** Reachable for an unmatched path under the unprefixed marketing tree (e.g. "/typo"). Always rendered on demand — see NotFoundContent's own doc comment. */
export default function NotFound() {
  return <NotFoundContent />;
}
