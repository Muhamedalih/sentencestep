import {
  FIRST_RUN_COOKIE,
  FIRST_RUN_COOKIE_MAX_AGE,
  FIRST_RUN_STORAGE_KEY,
  assignFirstRunVariant,
  parseFirstRunCookie,
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
 * This visitor's variant: the one in the address when `?first_run=` is present (and kept from then
 * on), else the one already stored, else a fresh random pick that is stored so the visitor keeps it.
 * Browser only — call it from an effect, never during render.
 */
export function resolveFirstRunVariant(): FirstRunVariant {
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
  const assigned = assignFirstRunVariant(Math.random());
  store(assigned);
  return assigned;
}
