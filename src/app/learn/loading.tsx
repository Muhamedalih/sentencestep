import { PageLoading } from "@/components/ui/page-loading";

/**
 * Covers /learn and every nested route (/learn/[mode], /learn/[mode]/[lessonId],
 * /learn/settings) that doesn't define its own more specific loading.tsx —
 * standard Next.js segment-boundary behavior.
 */
export default function Loading() {
  return <PageLoading />;
}
