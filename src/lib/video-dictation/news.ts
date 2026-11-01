/**
 * The «جديد» line that announces Video dictation on Home (the "videoNews" permission) and the tag on the
 * section's menu item. Whether a learner has already closed the line, or opened the section, is one
 * cookie in their own browser. It is a cookie, not localStorage, because the server draws the line: it
 * can leave it out for a learner who has seen it, instead of drawing it and hiding it after the page
 * loads, which would push the boxes down and back up. Nothing about it is stored on our side.
 */

export const VIDEO_NEWS_COOKIE = "ss_video_news";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/** Whether the value of the cookie says the learner has seen the announcement. */
export function isVideoNewsSeen(value: string | null | undefined): boolean {
  return value === "1";
}

/** What to assign to `document.cookie` to remember it for a year (marked Secure only where the page is served over https). */
export function videoNewsCookie(secure: boolean): string {
  return `${VIDEO_NEWS_COOKIE}=1; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Whether a whole `document.cookie` string carries the mark. */
export function documentCookieHasVideoNewsSeen(cookie: string): boolean {
  return cookie.split(";").some((part) => part.trim() === `${VIDEO_NEWS_COOKIE}=1`);
}
