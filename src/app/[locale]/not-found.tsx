import { NotFoundContent } from "@/components/layout/not-found-content";

/** Reachable for an unmatched path under a locale-prefixed marketing tree (e.g. "/es/typo"). Always rendered on demand — see NotFoundContent's own doc comment. */
export default function NotFound() {
  return <NotFoundContent />;
}
