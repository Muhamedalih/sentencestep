import { buildLlmsTxt } from "@/lib/public-pages/llms";
import { getSiteUrl } from "@/lib/site-url";

/** Built once at build time (the pages it lists are static too). */
export const dynamic = "force-static";

/** "/llms.txt": a plain-text map of the site for AI assistants (see src/lib/public-pages/llms.ts). */
export function GET() {
  return new Response(buildLlmsTxt(getSiteUrl()), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
