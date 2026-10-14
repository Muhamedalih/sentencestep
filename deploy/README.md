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
5. **Firewall.** Nothing to do by hand: `bootstrap-server.sh` installs
   `/usr/local/sbin/sentencestep-firewall` (from `deploy/cloudflare-firewall.sh`) and a systemd unit
   that allows TCP **80 and 443 only from Cloudflare's published address ranges**, in Docker's
   `DOCKER-USER` chain (Docker ignores ufw for published ports, so that chain is the real gate).
   It re-applies itself at boot and after a Docker restart, refreshes the list daily, and fails
   open (ports stay reachable) if Cloudflare's list cannot be fetched. SSH (22) is key-only with
   fail2ban and is not touched. Check it: `sudo iptables -S DOCKER-USER` shows one DROP rule, and
   from any non-Cloudflare machine `curl -sk --connect-timeout 8 https://<server>/` times out.
   The script is root-owned and is NOT updated by `sync`; to change it, copy it to the server and
   `sudo install -m 755 -o root -g root cloudflare-firewall.sh /usr/local/sbin/sentencestep-firewall`.
   An extra cloud-provider firewall (DigitalOcean → Networking → Firewalls) is an optional second layer.
   If the server ever gets an IPv6 address, the rule must be repeated with `ip6tables`.
6. **Cloudflare** (the domain's DNS is already there):
   - SSL/TLS → Overview: **Full (strict)** (choose it by hand: the default "Automatic" mode picks
     for you). Edge Certificates: **Always Use HTTPS on** (the origin deliberately drops port 80,
     so without this a visitor who types `http://` gets Cloudflare error 520) and **minimum TLS 1.2**
     (the default is 1.0).
   - SSL/TLS → Origin Server → Create Certificate for `sentencestep.com` and `*.sentencestep.com`
     (15 years). Done the way that keeps the private key on the server: generate the key and a CSR
     there (`openssl ecparam -genkey -name prime256v1 -noout -out origin.key`, then
     `openssl req -new -key origin.key -out origin.csr -subj "/CN=sentencestep.com"`), choose
     "Use my private key and CSR" in the dashboard, paste the CSR, and save the certificate it returns
     as `/opt/sentencestep/caddy/certs/origin.pem` (`chmod 600 origin.key`). After replacing either file
     run `docker exec sentencestep-caddy-1 caddy reload --force --config /etc/caddy/Caddyfile` — a plain
     reload does nothing when the Caddyfile itself is unchanged, so the old certificate would stay in use.
     Check which one is served: `echo | openssl s_client -connect 127.0.0.1:443 -servername sentencestep.com | openssl x509 -noout -issuer`.
   - Network: **IP Geolocation on** (this is what produces `cf-ipcountry`).
   - Speed → Settings → Content Optimization: **Rocket Loader off** (it was ON by default; it
     rewrites the page's scripts and breaks hydration; Auto Minify no longer exists). Security →
     Settings → **Email Address Obfuscation off** (it was ON by default; it rewrites e-mail addresses
     in the HTML, which makes React's hydration disagree with the server's markup). Judge every
     toggle by the picture, not by what the page's text says (grey knob on the left = off).
   - Caching → Configuration → **Browser Cache TTL: Respect Existing Headers** (the default of 4
     hours makes Cloudflare rewrite `max-age=0` to 4 hours on `sw.js`, icons and other files from
     /public, so a changed service worker would reach browsers hours late).
   - Rules → Transform Rules → _Modify Request Header_ → "Set static": `X-Origin-Auth` = the value of
     `ORIGIN_AUTH_SECRET`. (Cloudflare overwrites whatever a visitor sent, which is what makes the
     stamp trustworthy.) Scope the rule by hostname — `(http.host eq "staging.sentencestep.com")`
     while testing; at the cutover edit the expression to also match `sentencestep.com` and
     `www.sentencestep.com`. Paste the secret from the clipboard rather than typing it, and check the
     rule by its effect, not by opening it: from Iraq, `https://<host>/upgrade` must list the Iraqi
     wallets (ZainCash), and a forged `cf-ipcountry` / `x-origin-auth` sent by hand must change nothing.
   - Caching: nothing to add for `/_next/static/*` (a year, `immutable`, already served from
     Cloudflare's cache: `cf-cache-status: HIT`). `/_next/image` is not cached by default; the whole
     site used 20 source images a month, so a rule is not worth it. HTML is never cached by default,
     which is right (it varies by cookie). Marketing-page HTML caching is a later, separate step
     (see "Speed" below).
   - Known harmless noise: Cloudflare injects its Web Analytics beacon into HTML for browsers and the
     site's CSP blocks it, so the browser console shows one CSP error per page. It changes nothing
     visible; to silence it, disable Web Analytics for the zone or allow the script in the CSP.
   - Security → WAF → Custom rules: **Skip** all remaining rules for paths starting with
     `/api/billing/webhook`, `/api/email/inbound` and `/api/cron` (payment, e-mail and scheduler
     calls come from servers that cannot solve a browser challenge), and tick the extra components
     **Browser Integrity Check** and **Security Level** in that skip rule (their callers do not
     look like browsers either). Bot Fight Mode: off.
   - Zero Trust → Access (optional): protect `staging.sentencestep.com` (your e-mail + a service
     token for CI). Staging uses the live database, so this is a nice-to-have; the page tells search
     engines to stay away (`X-Robots-Tag`) and the address is not published.
   - DNS: `staging` → A record to the Reserved IP, **proxied**. (The apex and `www` stay as they are
     until the cutover.)
   - Turnstile: add `staging.sentencestep.com` to the widget's hostnames.
   - Supabase → Authentication → URL configuration: add `https://staging.sentencestep.com/**`.
7. **GitHub** → Settings → Secrets and variables → Actions: variables and secrets listed at the top
   of `.github/workflows/deploy-vps.yml`. The server's public SSH host key is committed as
   `deploy/known_hosts` under the name `server` (never the address). Set
   `DEPLOY_URL=https://staging.sentencestep.com`. The server's address goes in as the **secret**
   `SERVER_HOST` (this repository is public, so run logs are public: a secret is masked there, a
   variable is not), and `DEPLOY_ENABLED=true` switches the workflow on.
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

Already prepared (state on 2026-10-14, verified on the staging copy through Cloudflare): the database
change is applied; the Cloudflare zone is set up (Full strict, origin certificate valid to 2041, the
`X-Origin-Auth` rule already covers `sentencestep.com` and `www`, WAF skip rule, Always Use HTTPS,
TLS 1.2); the server firewall, watchdog and uptime workflow are running; a complete production env
file is waiting on the server as `/opt/sentencestep/server.env.production` (inactive; it holds a NEW
Wayl key made for this server, a freshly generated `WAYL_WEBHOOK_SECRET`, `WAYL_ENV=live`, and the live
`NEXT_PUBLIC_SITE_URL`); the privacy-text change is on branch `claude/privacy-new-hosting`.

Preconditions (confirm before starting): Netlify still has credits (it is the fallback, and costs
almost nothing once it gets no traffic); `WAYL_ENV=live` is right; the privacy wording is approved.

1. **Release the wording.** Merge `claude/privacy-new-hosting` into `master` (it must be true the moment
   the site moves). Then build the image the site will run, on the server, from that commit with the
   live address baked in (an image built for staging points auth e-mails and canonical URLs at staging):
   clone `master`, `docker build` with the five values in `deploy/build-public.env`,
   `NEXT_PUBLIC_SITE_URL=https://sentencestep.com`, `GIT_COMMIT_SHA=<sha>` and the Server Actions key as a
   build secret, tag it `sentencestep:<sha>` (about 2.5 minutes). Confirm it carries the right address:
   `grep -rl staging.sentencestep.com /app/.next` inside the image must find nothing.
2. **Rehearse it in isolation** (no traffic): run the image with `--env-file server.env.production` on the
   compose network with no published port, and check `/api/health` reports the commit and an UNSIGNED
   `POST /api/billing/webhook/wayl` answers `401 Invalid webhook signature` (it answers 501 when Wayl is
   not configured).
3. **Switch the server to the live env and deploy.** `cp server.env server.env.staging-backup`, then
   `cp server.env.production server.env` (mode 600), then
   `docker save sentencestep:<sha> | gzip | /opt/sentencestep/deploy.sh <sha>`. The blue/green script starts the
   new copy, waits until it is healthy, flips Caddy gracefully and probes through it. Run the smoke test
   from the server with a temporary `/etc/hosts` line for `sentencestep.com` and the origin
   certificate as `CURL_CA_BUNDLE` (as done for staging), then remove that line.
4. **Move the traffic** (Cloudflare → DNS, at a quiet hour, with the owner present). Edit the apex record
   `sentencestep.com`: type **A**, `165.245.161.138` (the server), **Proxied**. Edit `www`: **CNAME** →
   `sentencestep.com`, **Proxied**. Cloudflare applies it at once; resolvers holding the old answer reach
   Netlify for up to its TTL (both serve the same database, so nobody notices).
5. **Check it from outside**: `deploy/smoke-test.sh https://sentencestep.com <sha>` (23 checks); from Iraq
   `https://sentencestep.com/upgrade` must list the Iraqi wallets; `http://` redirects to `https://`; `www`
   redirects to the bare domain; one cron call with the real secret
   (`/api/cron/session-word-audio`, harmless) answers 200 and a wrong secret 401; sign in with a real
   account and open a lesson with audio.
6. **First real payment**: the owner pays the smallest plan once; check the order becomes paid, Premium
   is active, and the webhook arrived (Wayl dashboard + Supabase `payment_orders`).
7. **Move the pipeline**: GitHub variables `DEPLOY_URL=https://sentencestep.com`; the workflow trigger
   becomes `release`. In Netlify lock auto publishing (Deploys → "Lock to stop auto publishing") so a push
   to `release` no longer spends 15 credits there; Netlify stays as the standby.
8. Watch Sentry, Supabase logs and the uptime workflow for 30 minutes, then daily for a week.
9. Later (after about a week without trouble): remove Netlify's old Wayl key in the Wayl dashboard, delete
   the temporary QA account, and decide whether to retire the Netlify site.

**Rolling back to Netlify** (takes about a minute): in Cloudflare DNS restore exactly these records and set them to _DNS only_ (grey cloud). These are the records as they were before the migration (checked in the Cloudflare dashboard on 2026-10-14); the apex is a CNAME that Cloudflare flattens, which resolves to Netlify's addresses `75.2.60.5` and `99.83.231.61`:

| Name               | Type  | Value (as of the migration)     |
| ------------------ | ----- | ------------------------------- |
| `sentencestep.com` | CNAME | `apex-loadbalancer.netlify.com` |
| `www`              | CNAME | `sentencestep.netlify.app`      |

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
- **Caddy's files**: `sync` keeps `caddy/Caddyfile` current and reloads Caddy gracefully, but it never
  restarts containers. After a change to `docker-compose.yml` that concerns Caddy itself (ports, mounts),
  run `cd /opt/sentencestep && docker compose --env-file state.env up -d caddy` once, in a quiet hour.
  The container sees `/opt/sentencestep/caddy` as a whole directory on purpose: a single-file bind mount
  keeps pointing at the old file after the file is replaced, which once made every traffic switch a no-op.
- **Secrets**: never paste `server.env` values in chat or tickets. Rotate `ORIGIN_AUTH_SECRET` in both
  places (Cloudflare rule and `server.env`) if it is ever exposed.
