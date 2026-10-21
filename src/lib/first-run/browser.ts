import {
  FIRST_RUN_CONFIG_URL,
  FIRST_RUN_COOKIE,
  FIRST_RUN_COOKIE_MAX_AGE,
  FIRST_RUN_STORAGE_KEY,
  decideFirstRunVariant,
  parseFirstRunCookie,
  sharePercentFromConfig,
  variantFromSearch,
  type FirstRunVariant,
} from "@/lib/first-run/variant";

function readStored(): FirstRunVariant | null {
  try {
    const stored = parseFirstRunCookie(window.localStorage.getItem(FIRST_RUN_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // Storage blocked: the cookie below is the other copy.
  }
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${FIRST_RUN_COOKIE}=`));
  return parseFirstRunCookie(entry?.slice(FIRST_RUN_COOKIE.length + 1));
}

function store(variant: FirstRunVariant): void {
  try {
    window.localStorage.setItem(FIRST_RUN_STORAGE_KEY, variant);
  } catch {
    // Same best-effort posture as the guest progress store.
  }
  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${FIRST_RUN_COOKIE}=${variant}; path=/; max-age=${FIRST_RUN_COOKIE_MAX_AGE}; samesite=lax${secure}`;
  } catch {
    // Cookies blocked: only the server-side events lose the variant.
  }
}

/**
 * The variant this visitor already has — the one in the address when `?first_run=` is present (and
 * kept from then on), else the one stored — or null when they have none yet. Synchronous, so the
 * provider can use it before the first paint. Browser only.
 */
export function readFirstRunVariantNow(): FirstRunVariant | null {
  const forced = variantFromSearch(window.location.search);
  if (forced) {
    store(forced);
    return forced;
  }
  const existing = readStored();
  if (existing) {
    store(existing);
    return existing;
  }
  return null;
}

/** The share of new visitors given the short first run, from the Permissions page; 0 on any failure or after 2.5 seconds, so a slow answer never holds the visitor up. */
async function fetchShortShare(): Promise<number> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(FIRST_RUN_CONFIG_URL, { signal: controller.signal });
    if (!response.ok) return 0;
    return sharePercentFromConfig(await response.json());
  } catch {
    return 0;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * The first run for a visitor who has none yet: randomized by the share the Permissions page has
 * switched on, and remembered — or the long first run, remembering nothing, while that share is 0.
 * Browser only.
 */
export async function resolveFirstRunVariant(): Promise<FirstRunVariant> {
  const known = readFirstRunVariantNow();
  if (known) return known;
  const decision = decideFirstRunVariant({
    forced: null,
    stored: null,
    sharePercent: await fetchShortShare(),
    random: Math.random(),
  });
  if (decision.remember) store(decision.variant);
  return decision.variant;
}
