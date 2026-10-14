# Self-hosted deployment (replaces Netlify)

> **ملخص بالعربية:** الموقع يعمل على سيرفر واحد (DigitalOcean) داخل Docker، وأمامه
> Cloudflare المجاني. كل `push` يبني صورة جديدة في GitHub ثم يرسلها للسيرفر، ويشغّلها
> بجانب النسخة القديمة، ويفحصها، ثم يحوّل الزوار إليها بدون أي توقف. إذا فشل أي فحص
> يرجع كل شيء تلقائياً للنسخة السابقة. كل البيانات (المستخدمون، الدروس، الصوت، الصور)
> تبقى في Supabase ولا يلمسها هذا النقل. الاحتياط: Netlify يبقى جاهزاً أسبوعين بعد
> التحويل، والرجوع إليه تغيير سجلّي DNS فقط (الجدول في آخر هذا الملف).

Nothing about the app's data moves: users, lessons, audio and images live in
Supabase (database, auth, storage) exactly as before. Only the thing that runs the
Next.js server changes.

```
visitor ──► Cloudflare (free: CDN, DDoS, caching, TLS) ──► Caddy ──► app-blue | app-green ──► Supabase
                                                             (the server, Docker)
```

| What Netlify did                                 | What does it now                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Build on every push                              | GitHub Actions (`.github/workflows/deploy-vps.yml`) builds the Docker image                              |
| Atomic deploy, no downtime                       | blue/green slots + health check + graceful Caddy reload (`deploy.sh`)                                    |
| One-click rollback                               | `rollback.sh` (instant) / the workflow's "rollback" button                                               |
| CDN, TLS, DDoS protection                        | Cloudflare (free plan) in front, Cloudflare Origin certificate on the server                             |
| Edge country for pricing (`Netlify.context.geo`) | `cf-ipcountry`, trusted only with the secret `x-origin-auth` stamp (`src/lib/security/trusted-proxy.ts`) |
| Image CDN                                        | `sharp` inside the image + Cloudflare caching of `/_next/image`                                          |
| Environment variables UI                         | `/opt/sentencestep/server.env` on the server + GitHub variables/secrets for the build                    |
| Function logs                                    | `docker logs` + Sentry                                                                                   |
| Scheduled calls                                  | unchanged: GitHub Actions cron calling `https://sentencestep.com/api/cron/*`                             |
| Deploy previews                                  | one staging copy (`staging.sentencestep.com`) following `master`                                         |

## Files

| File                                                                | Purpose                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `Dockerfile` (repo root)                                            | multi-stage image: deps → build (standalone output) → small runtime |
| `deploy/docker-compose.yml`                                         | Caddy + the two app slots                                           |
| `deploy/Caddyfile`, `active-upstream.caddy.example`                 | origin web server; which slot is live                               |
| `deploy/bootstrap-server.sh`                                        | one-time server hardening and setup                                 |
| `deploy/sync.sh`, `deploy.sh`, `rollback.sh`, `status.sh`, `lib.sh` | what runs on the server                                             |
| `deploy/ci-entry.sh`                                                | the only command the CI SSH key may run                             |
| `deploy/smoke-test.sh`                                              | read-only health/correctness checks of any deployed URL             |
| `deploy/server.env.example`                                         | names of the server's environment variables (no values)             |

## One-time setup

Who does what: **you** create the accounts and paste secrets; the repository does the rest.

1. **Server.** DigitalOcean → Droplet, Ubuntu 24.04, 2 vCPU / 4 GB, region Richmond (or NYC3 —
   whichever is faster to Supabase, measured), enable backups, add your SSH public key.
   Create a **Reserved IP** and attach it (so the address survives a rebuild).
2. **Keys.** On your computer: `ssh-keygen -t ed25519 -f ci-deploy -C ci-deploy -N ""`. The
   public half goes to the bootstrap command below; the private half becomes the GitHub secret
   `SERVER_SSH_KEY`. Never reuse a personal key for CI.
3. **Bootstrap.** `scp -r deploy root@SERVER:/root/deploy`, then
   `ssh root@SERVER "bash /root/deploy/bootstrap-server.sh '<your public key>' '<ci-deploy.pub contents>'"`.
   After this, root login is disabled; use `ssh deploy@SERVER`.
4. **Secrets on the server.** Fill `/opt/sentencestep/server.env` (copy each value from the Netlify
   environment variables; add `ORIGIN_AUTH_SECRET` = 48+ random characters, e.g.
   `openssl rand -hex 32`). Permissions stay `600`.
5. **Firewall** (DigitalOcean → Networking → Firewalls): inbound TCP **80 and 443 only from
   Cloudflare's address ranges** (https://www.cloudflare.com/ips/), TCP 22 from anywhere (key-only,
   fail2ban). Docker ignores the server's own firewall for published ports, so this cloud
   firewall is the real gate.
6. **Cloudflare** (the domain's DNS is already there):
   - SSL/TLS → Overview: **Full (strict)**. Edge Certificates: Always Use HTTPS on, minimum TLS 1.2.
   - SSL/TLS → Origin Server → Create Certificate for `sentencestep.com` and `*.sentencestep.com`
     (15 years). Save the two files on the server as `/opt/sentencestep/certs/origin.pem` and
     `origin.key` (`chmod 600 origin.key`). Keep a copy in your password manager.
   - Network: **IP Geolocation on** (this is what produces `cf-ipcountry`).
   - Speed → Optimization: **Rocket Loader off**, Auto Minify off (they rewrite the page's scripts
     and break hydration).
   - Rules → Transform Rules → _Modify Request Header_: for all requests set the header
     `X-Origin-Auth` to the same value as `ORIGIN_AUTH_SECRET`. (Cloudflare overwrites whatever a
     visitor sent, which is what makes the stamp trustworthy.)
   - Rules → Cache Rules: (a) path starts with `/_next/static/` → eligible for cache, respect origin
     headers (they are `immutable`); (b) path starts with `/_next/image` → eligible for cache,
     edge TTL 7 days. Marketing-page HTML caching is a later, separate step (see "Speed" below).
   - Security → WAF → Custom rules: **Skip** all remaining rules for paths starting with
     `/api/billing/webhook`, `/api/email/inbound` and `/api/cron` (payment, e-mail and scheduler
     calls come from servers that cannot solve a browser challenge). Bot Fight Mode: off.
   - Zero Trust → Access: protect `staging.sentencestep.com` (your e-mail + a service token for CI).
   - DNS: `staging` → A record to the Reserved IP, **proxied**. (The apex and `www` stay as they are
     until the cutover.)
   - Turnstile: add `staging.sentencestep.com` to the widget's hostnames.
   - Supabase → Authentication → URL configuration: add `https://staging.sentencestep.com/**`.
7. **GitHub** → Settings → Secrets and variables → Actions: variables and secrets listed at the top
   of `.github/workflows/deploy-vps.yml`. `SERVER_HOST_KEY` is the output of
   `ssh-keyscan -t ed25519 <reserved ip>`. Set `DEPLOY_URL=https://staging.sentencestep.com`.
8. **Database change** (once, before the first deploy that serves real checkouts):
   apply `supabase/migrations/20250334000000_pricing_country_source_cloudflare.sql`. It only widens
   one check constraint; no row is touched.
9. **First start.** `ssh deploy@SERVER "cd /opt/sentencestep && docker compose up -d caddy"`, then push
   to `master` (or run the workflow). The first deploy prints every step; afterwards
   `deploy/smoke-test.sh https://staging.sentencestep.com` must say "All checks passed."

## Day to day

| Want to…             | Do                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Deploy               | push to the trigger branch (`master` while testing, `release` after cutover)                                                                     |
| Roll back            | GitHub → Actions → _Deploy to the self-hosted server_ → Run workflow → tick **rollback**; or `ssh deploy@SERVER "/opt/sentencestep/rollback.sh"` |
| See what is running  | `ssh deploy@SERVER "/opt/sentencestep/status.sh"`                                                                                                |
| Read the site's logs | `ssh deploy@SERVER "docker logs --tail 200 sentencestep-app-blue-1"` (or `-green-`; `status.sh` says which is live)                              |
| Check any URL        | `deploy/smoke-test.sh https://sentencestep.com <commit>`                                                                                         |

## Cutover (production from Netlify to the server)

Preconditions: the staging copy has run for several days without errors; `smoke-test.sh` passes;
a real payment test and the Wayl/Resend webhooks have been verified on staging; a Supabase backup and
a Cloudflare DNS export are saved; the database change is applied.

1. A day before: lower the TTL of the apex and `www` records to 60 s (or leave them proxied after the switch).
2. Freeze merges. Deploy the final commit to staging; run the smoke test.
3. Add the Cloudflare **Origin certificate** hostnames for the apex if not already covered, confirm
   Caddy serves `sentencestep.com` (test with `curl --resolve sentencestep.com:443:<ip> -k https://sentencestep.com/api/health`).
4. In Cloudflare DNS, at the quietest hour: apex `A` → the Reserved IP, **proxied**; `www` `CNAME` → `sentencestep.com`, **proxied**.
5. Switch the workflow trigger to `release` and `DEPLOY_URL` to `https://sentencestep.com`.
6. Run `deploy/smoke-test.sh https://sentencestep.com`, then the 12-point manual list (home, sign-in, a lesson,
   audio, word lists, the Iraq price, admin, a webhook, a cron call).
7. Watch Sentry, Supabase logs and the uptime monitor for 30 minutes.

**Rolling back to Netlify** (takes about a minute): in Cloudflare DNS restore exactly these records and set them to _DNS only_ (grey cloud):

| Name               | Type  | Value (as of the migration) |
| ------------------ | ----- | --------------------------- |
| `sentencestep.com` | A     | `75.2.60.5`                 |
| `sentencestep.com` | A     | `99.83.231.61`              |
| `www`              | CNAME | `sentencestep.netlify.app`  |

Both hosts use the same database, so nothing diverges while you move back and forth.

## Speed: caching the marketing pages (optional, after cutover)

The home and legal pages are static, but the app's middleware redirects returning visitors (language
cookie) and signed-in visitors, so their HTML must not be cached for those visitors. A Cache Rule can
cache `/`, `/ar`, `/es`, `/tr`, `/privacy`, `/terms` for a few minutes **only when the request has no
`sb-*` or `ss_locale` cookie**. Enable it only after the cutover is stable and test it with and without cookies.

## Operating notes

- **Memory/CPU**: each slot is limited to 1.8 GB. Alerts (DigitalOcean → Monitoring): CPU > 80 % for 10 min,
  memory > 85 %, disk > 80 %. If CPU stays above 60 %, resize the droplet.
- **Uptime monitor**: monitor `https://sentencestep.com/api/health` (expects `"status":"ok"`) every minute,
  with e-mail/Telegram alerts.
- **Updates**: security updates install automatically; there is no automatic reboot. Reboot monthly in a quiet
  hour (`sudo reboot`; containers restart by themselves in about 30 s).
- **Disaster recovery**: the server holds no data. New droplet → bootstrap → restore `server.env` and
  the origin certificate from the password manager → run the deploy workflow → move the Reserved IP.
- **Cloudflare 100-second limit**: a single request through Cloudflare may not take longer than 100 s
  (Netlify's limit was lower). Long admin jobs must stay bounded.
- **Secrets**: never paste `server.env` values in chat or tickets. Rotate `ORIGIN_AUTH_SECRET` in both
  places (Cloudflare rule and `server.env`) if it is ever exposed.
