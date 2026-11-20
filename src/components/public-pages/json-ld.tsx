import { jsonLdString } from "@/lib/public-pages/json-ld";

/** Structured data for search engines and assistants. A data block, not a script that runs, so it needs nothing from the page's content policy. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
  );
}
