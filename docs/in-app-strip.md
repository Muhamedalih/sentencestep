# The "open in browser" strip (Facebook and Instagram)

Inside Facebook's and Instagram's built-in browsers Google refuses its sign-in page, notifications cannot
be asked for and the site cannot be installed, and about a third of the sessions come from them (Clarity,
9-18 October). 172 of the latest 200 accounts (2026-10-27) were made with Google, and only 9% of the
sign-up events are tagged as coming from an in-app browser, so the sign-up page is where those visitors are
lost. On the **sign-up and sign-in pages, inside those two browsers only**, the "Continue with Google"
button is replaced by a quiet strip that gets the visitor into their own browser. The email form stays right
below it. Nothing changes anywhere else.

Approved mockup: option A of 2026-10-27 (the strip inside the card; the slim bar on every screen, option B,
was not chosen).

## What it looks like

A tinted box (brand colour at 10%, a hairline of it at 35%, radius 14px, padding 12px 14px) holding an icon
and "Open this page in your browser", one sentence (13px) and:

- **Android**: a tinted "Open in browser" button (flex, 40px) and a "Copy link" button. The button is an
  `intent://` link that opens the same address in Chrome (the address itself is the fallback). If the page is
  still on screen 1.5 s after the tap, a line says to press the menu and choose "Open in browser".
- **iPhone** (and anything that is not Android): two steps ("Tap ⋯ at the top of the screen", "Choose Open in
  browser") and a full-width "Copy link" button, because a page cannot open another app on iPhone.

The sentence names the browser ("Facebook's browser" or "Instagram's browser"). The copied or opened address
is this page with the visitor's `ias` number added (below) and, when it has none, the utm tags of where the
visitor first came from (the `ss_ft` cookie), so a sign-up in their own browser is not filed as "direct".
Strings: `t.auth.inAppStrip` in the four dictionaries. Not yet tried on a real phone inside Facebook or
Instagram: the `intent://` link and the wording of the apps' own menu need that check before the permission
is opened.

## The permission and the test

`inAppStrip` in /admin/permissions (a "share of new visitors", like the short first run). Nothing is shown
until it is switched on to a share:

- Each visitor who arrives in Facebook's or Instagram's browser gets a random number from 0 to 99 once,
  kept in the `ss_ias` cookie (`InAppBucketCookie`, mounted next to `FirstTouchCookie`). Visitors with a
  number below the share get the strip; the others keep the Google button (the comparison group). A bigger
  share only adds visitors.
- The number travels in the link the strip opens (`?ias=`), and any browser that receives it keeps it, so
  a sign-up made in the visitor's own browser still belongs to the same group.
- A visitor who lands directly on the sign-up page with no number is given one there (the strip may then
  appear a moment after the page, for that visitor only).
- To look at it (an admin, or whoever the permission is open to): `/register?in_app_strip=facebook-android`,
  `facebook-ios`, `instagram-android` or `instagram-ios`, in any browser. To try the real thing, open
  `/register?in_app_strip=on` inside Facebook's or Instagram's browser on a phone (for example from a link in
  a message): `on` shows the strip there whatever the share.

## What is recorded

- `IN_APP_STRIP_SHOWN` { app, platform, page, shown, forced, bucket }: a visitor in one of those browsers
  opened the sign-up or sign-in page while the test was on; `shown` says which group. At most one per browser
  session and page.
- `IN_APP_STRIP_OPEN_CLICKED` and `IN_APP_STRIP_COPY_CLICKED` { app, platform, page, bucket }.
- `USER_SIGNED_UP`, `LESSON_STARTED` and `LESSON_COMPLETED` carry `inAppBucket` (as text) when the browser
  has the cookie. Email sign-ups need no confirmation (all 28 latest email accounts were confirmed within
  5 seconds of being made), so `USER_SIGNED_UP` is written in the browser where the account is created,
  which has the cookie in both groups.

Reading it (no script yet): per day, `IN_APP_STRIP_SHOWN` rows by `bucket` below / not below the share, against
`USER_SIGNED_UP` rows with `inAppBucket` in the same two groups, then day-one lessons by user. The strip's own
success is the sign-up rate of the visitors who reached the page, not clicks. A visitor in the comparison
group who leaves the in-app browser by hand loses the number (a small bias in the strip's favour).
Choose the read date before giving it to a share, and do not move it.
