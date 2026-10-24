# Redeem codes (sold by local agents)

**Status (2026-10-24): designed, rules written and tested, NOT built and NOT applied.** What exists is
pure logic with tests (`src/lib/redeem/`) and an unapplied migration
(`supabase/migrations/20250349000000_redeem_codes.sql`). Nothing in the app calls either. The admin
pages, the "I have a code" box and applying the SQL wait for the owner's yes; the box and the admin
pages also wait for mockups.

## Why

Last 30 days (payments-funnel readout, 2026-10-24): 411 orders, 44 paid. The five weak regions
(Egypt, Maghreb, Levant, Sudan, Yemen) are 232 orders and 11 paid (4.8%); everywhere else is 179 orders
and 33 paid (18.4%). Egypt alone is 144 orders and 3 paid. Egypt is wallet-first (Vodafone Cash,
InstaPay, Fawry), so a cards-only gateway cannot work there, and the owner cannot take those wallets
from Iraq. A person in the learner's own country can: an agent takes the local money and pays the owner
in USDT, which the site already receives automatically (Binance Pay). The code is the only thing that
crosses the border.

If the weak regions paid like the rest: about +31 payers and about +$135 a month at today's traffic.
That is the ceiling, not a forecast. An agent channel will capture a fraction of it.

## The deal, in order

1. The owner vets an agent (checklist in the agent kit) and marks them **active**.
2. The agent orders N codes of plan X and **pays first** (USDT, Binance Pay). The owner records the
   amount and reference when issuing the batch; the system refuses if what was received is below the price.
3. The owner issues the batch: the server makes the codes, stores only their HMAC, and shows the codes
   **once** (copy / CSV). The owner sends them to the agent.
4. The agent sells each code for local money, privately, at their own price.
5. The learner signs in, opens the plans page, types the code, and gets the days. Days stack on Premium
   they still have, exactly like a paid order and the admin grant.

No credit, ever. The agent carries the risk of unsold codes; the owner carries none.

## What is in the repo

| File                                                  | What                                                                                                                                                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/redeem/constants.ts`                         | alphabet, lengths, limits                                                                                                                                                                     |
| `src/lib/redeem/code.ts`                              | normalise what a person typed (case, dashes, Arabic digits, invisible direction marks), check symbol, format. Client-safe.                                                                    |
| `src/lib/redeem/generate.ts`                          | generate codes, HMAC them (`node:crypto`, server only)                                                                                                                                        |
| `src/lib/redeem/redemption.ts`                        | `decideRedemption`: the table the database function is checked against                                                                                                                        |
| `src/lib/redeem/attempts.ts`                          | the throttle, as readable rules                                                                                                                                                               |
| `src/lib/redeem/batch.ts`                             | `planBatch`: the dealing rules (agent pays first, first order of 5, holding limit, price sanity); `wholesaleCentsFor` ladder lookup                                                           |
| `src/lib/redeem/ledger.ts`                            | per-agent numbers (issued, redeemed, outstanding, sell-through)                                                                                                                               |
| `src/lib/redeem/sql-parity.test.ts`                   | fails if a limit in the SQL and in `constants.ts` drift apart                                                                                                                                 |
| `supabase/migrations/20250349000000_redeem_codes.sql` | tables `redeem_agents`, `redeem_batches`, `redeem_codes`, `redeem_attempts`; functions `create_redeem_batch`, `redeem_code`; guards; RLS on with no policies; grants to the service role only |

The SQL was run end to end in an in-memory Postgres (PGlite) with stand-ins for `auth.users` and
`subscriptions`: 56 checks (issuing rules, stacking, restart after expiry, "unlimited" keeps the code,
voided and expired batches, throttle per learner / per day / per address, ledger guards, grants). The
script is `check-redeem-sql.mjs` in the session notes folder. After the owner applies the migration,
the same rules can be spot-checked on production with a rolled-back `DO` block (end it with
`raise exception`), the way the Binance migration was.

## The code

16 symbols from the same 31-symbol alphabet as the Binance order codes (no 0/O, no 1/I/L), shown as
`ABCD-EFGH-JKMN-PQRS`: 15 random symbols (31^15, about 2^74) plus one check symbol (weighted sum mod 31;
catches every single wrong symbol and every swap of two different neighbours). A code with a bad check
symbol is turned away in the browser and **does not count** as a failed attempt.

**Stored as** `HMAC-SHA256(pepper, "redeem-code:v1:" + canonical code)`. The pepper is a new server
secret, `REDEEM_CODE_PEPPER` (at least 32 random characters), in `/opt/sentencestep/server.env` and
`.env.local`. Losing or changing it makes every unredeemed code unredeemable, so treat it like
`BINANCE_RELAY_SECRET`: set once, never rotate casually. Without it the feature fails closed.

Never put a code in a URL (history, referrers, logs). A shareable link may carry it after `#`
(`/redeem#ABCD-…`), which the browser never sends to the server and a small script copies into the box.

## Redeeming (server)

Server action on the signed-in learner's session; the user id is the session's, never a posted value:

1. `normalizeCode(input)`. Bad format: say what is wrong, no database call, no attempt counted.
2. `hashCode(code, pepper)`; the address is hashed with the same pepper (`ip_hash`), never stored raw.
3. `rpc redeem_code(user_id, code_hash, country, ip_hash)` with the service-role client. One
   transaction: advisory locks per learner and per address, throttle, find the code, decide, add the
   days to `subscriptions` (provider `agent_code`, `provider_subscription_id = 'code:<id>'`), mark the
   code redeemed, record the attempt.
4. Map `result` to a message: `redeemed`, `used_by_you`, `unlimited`, `unknown`, `used`, `voided`,
   `expired`, `throttled` (+ seconds), `user_not_found`, `bad_request`.
5. On `redeemed`: revalidate the learner's pages, emit an analytics event, show "Premium until <date>"
   with a button to Today. No receipt email in v1 (the confirmation is on screen and the expiry
   reminders already run on `subscriptions.current_period_end`).

Country for `redeemed_country` comes from the trusted resolver (`resolvePricingCountry`), never from a
header the browser can set.

## Abuse and fraud rules

| Risk                                     | Rule                                                                                                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guessing codes                           | 2^74 space + 5 wrong tries / 10 min and 20 / day per learner, 40 / hour per address; throttled tries are not recorded so waiting never extends the wait; tries serialised by advisory locks so parallel bursts cannot slip past |
| A leaked database                        | codes are HMACs under a secret held only by the server                                                                                                                                                                          |
| A code used twice                        | single-use under a row lock; the same learner repeating it gets "already yours" and nothing more                                                                                                                                |
| An agent who cheats or a list that leaks | void the batch: its unredeemed codes stop working at once; redeemed codes stay (the learner did nothing wrong)                                                                                                                  |
| Agent hoarding or dumping                | holding limit per agent (a new agent starts at 5; the owner raises it to 20, then 50, as codes get redeemed), batch of at most 200, first order at most 5, codes expire (30 to 365 days, default 120)                           |
| Credit / the owner out of pocket         | `received >= price` is a database check on the batch; no credit path exists                                                                                                                                                     |
| Premium that never ends                  | an account with Premium and no end date keeps the code unused                                                                                                                                                                   |
| Ledger tampering                         | codes and batches cannot be deleted; a redeemed or voided code is final; a batch can only be voided or extended                                                                                                                 |
| Cross-region price arbitrage             | codes are priced for the cheap tier; the dealing rules say an agent sells only in their own region (cannot be enforced, can be seen: `redeemed_country` per agent)                                                              |

## Admin pages (outline, needs mockups)

- `/admin/agents`: agents with status, holding, sell-through, money in; "new agent"; status switch.
- `/admin/agents/[id]`: ledger (batches, codes by status, money), notes, pause / end.
- New batch: plan quantities (price from the wholesale ladder, editable), received amount + method +
  reference, validity. Refused with the exact reason by `planBatch`, then by the database. On success
  the codes are shown once with "Copy all" and CSV; leaving the page loses them (batch can be voided
  and reissued).
- Look up a code: paste it, see status / batch / serial / agent / redeemed-by (admin only). For disputes.
- Void batch (with a reason).

## Learner screen (outline, needs mockups)

A quiet "I have a code" row on `/upgrade` (not on the lock card: the owner wants that card without a
payment-methods row), opening an input (`dir="ltr"`, Latin letters, auto-uppercase, tolerant paste) and
one button; the five outcomes as short calm messages; success shows the new end date and a button to
Today. Guests are sent to sign in and come back. All strings in ar / en / es / tr.

## Measurement and stop lines

New events: `REDEEM_CODE_SUBMITTED {outcome}`, `REDEEM_CODE_SUCCEEDED {planId, days, country}`. A
read-only readout script (same pattern as `payments-funnel-readout.ts`): per agent and per country:
codes issued, redeemed, sell-through, median days to redeem, plus how many redeemers had earlier
unpaid orders. Judge by counts, not rates, for the first months.

Stop line [proposal]: after 8 weeks, if no agent has sold 20 codes, stop recruiting and keep only what
works; the cost of stopping is a few hundred lines that sit unused.

## Build order

1. (done) pure logic, tests, unapplied SQL, this document.
2. Owner approves: apply the SQL, add `REDEEM_CODE_PEPPER`, pick the screens from mockups.
3. Server actions (redeem, issue batch, void, agent CRUD) and admin pages; `redeemCodes` entry in
   `src/lib/rollouts/catalog.ts` (Admins only first).
4. The box on `/upgrade`; strings in four languages; Browser-pane check on desktop and phone.
5. One test code redeemed by the owner on his own test account, the rolled-back SQL spot-check, then
   the first agent with the first batch of 5.

## Not in v1 (later, only if agents sell)

- Agent self-service: the agent logs in, pays by the existing Binance Pay note-code flow, and sees the
  codes appear. Needs custom-amount orders, which the order table does not have today.
- A receipt email for a redeemed code.
- Typing codes on an Arabic keyboard layout (letters would need a key-position map).
