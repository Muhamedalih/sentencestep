import { LOCALE_COOKIE } from "@/lib/i18n/locale-cookie";
import { supportLocaleFromBrowser, type SupportLocale } from "@/lib/i18n/locales";

/**
 * The visitor's browser language as a REAL SupportLocale, for places that must persist one (there is
 * no such thing as a persisted "English UI" choice — English is only ever a transient pre-choice
 * rendering fallback), not just the display-only detection LocaleProvider does for itself. Browser
 * only.
 */
export function detectBrowserLocale(): SupportLocale {
  return supportLocaleFromBrowser(
    navigator.languages?.length ? navigator.languages : [navigator.language],
  );
}

/**
 * Resolves once the ss_locale cookie is in the browser (setPreferredLanguageAction writes it from
 * a request the first-run flow does not wait on), or after `timeoutMs` — whichever comes first. A
 * page the visitor is sent to without that cookie would show the language picker over itself.
 */
export async function waitForLocaleCookie(timeoutMs = 2000): Promise<void> {
  const hasCookie = () =>
    document.cookie.split("; ").some((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`));
  const deadline = Date.now() + timeoutMs;
  while (!hasCookie() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
