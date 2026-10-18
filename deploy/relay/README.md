# Binance Pay relay

> **ملخص بالعربية:** هذا برنامج صغير يعمل على سيرفر **خارج أمريكا** (فرانكفورت). موقعنا على سيرفر في أمريكا
> وباينانس يرفض الطلبات الأمريكية (خطأ 451)، فلا يقدر الموقع يقرأ حسابك مباشرة. هذا البرنامج يسأل الموقع
> "هل أحد ينتظر الدفع؟"، وإذا نعم يقرأ سجل Binance Pay بمفتاح **قراءة فقط** مقيّد بعنوان السيرفر، ويرسل
> التحويلات الواردة للموقع. هو لا يفتح أي منفذ، ولا يقرر شيئاً: الموقع هو اللي يقرر إذا التحويل يخص طلباً.

The site runs on a server in the US; Binance answers requests from the US with HTTP 451, so the site cannot read
the shop's Binance account itself. The relay runs on a small server outside the US and does only this:

1. every few seconds it asks the site (`GET /api/payments/binance/pending`) whether anyone is waiting to pay;
2. if so, it reads the Binance Pay history (`GET /sapi/v1/pay/transactions`) with a **read-only**, **IP-restricted** key;
3. it posts the **incoming** transfers to the site (`POST /api/payments/binance/ingest`).

The site decides what a transfer means (`src/lib/billing/binance/matching.ts`): a transfer whose note holds an
order's code (`SS-XXXXX`) and that covers the price activates Premium; anything else waits on **Admin → Binance
Pay**. The relay opens no port, writes no file, and holds no decision.

## Where it runs

DigitalOcean, Frankfurt (`FRA1`), the smallest droplet ($4/month), on its own DigitalOcean account. Hardened:
root login and passwords off (`AllowUsers deploy`, key only), `ufw` allows only SSH, fail2ban, unattended upgrades,
512 MB swap. Log in with `ssh -i ~/.ssh/sentencestep_admin deploy@<relay address>`.

## Files on the relay

| Path                                      | What                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `/opt/looma-relay/poller.py`              | this program (`deploy/relay/poller.py`)                                    |
| `/etc/looma-relay/relay.env`              | `root:relay`, mode 640: the secrets (below). Never in git.                 |
| `/etc/systemd/system/looma-relay.service` | the service (`deploy/relay/looma-relay.service`), runs as the `relay` user |
| `/opt/looma-relay/probe.py`               | read-only checks of the Binance key (not part of the service)              |

`relay.env` holds: `BINANCE_API_KEY`, `BINANCE_API_SECRET` (a read-only key; _Enable Reading_ only, restricted to
the relay's address in Binance → API Management), `BINANCE_RELAY_SECRET` (48+ random characters, the **same** value
as `BINANCE_RELAY_SECRET` in the site's `/opt/sentencestep/server.env`), and optionally `SITE_URL`
(default `https://sentencestep.com`).

## Install or update

```bash
# from a checkout of this repository, on a machine that can ssh to the relay
scp deploy/relay/poller.py deploy/relay/looma-relay.service deploy/relay/README.md deploy@RELAY:/tmp/
ssh deploy@RELAY 'sudo install -D -m 755 -o root -g root /tmp/poller.py /opt/looma-relay/poller.py \
  && sudo install -m 644 /tmp/README.md /opt/looma-relay/README.md \
  && sudo install -m 644 /tmp/looma-relay.service /etc/systemd/system/looma-relay.service \
  && sudo systemctl daemon-reload && sudo systemctl enable --now looma-relay'
```

Check it: `sudo systemctl status looma-relay`, `journalctl -u looma-relay -n 50 --no-pager`. A healthy log says
`pending: nothing to look for` while nobody is waiting, and `ingest: sent=… received=… inserted=… linked=…`
while someone is. Try one round by hand without posting anything: `sudo -u relay env $(sudo cat /etc/looma-relay/relay.env | xargs) python3 /opt/looma-relay/poller.py --once --no-post`.

## If something goes wrong

- **Admin → Binance Pay says "Relay offline"** (and, when someone is waiting, the admins get an alert): the service
  is down or cannot reach the site. `systemctl status looma-relay`, then the journal.
- **"Binance refuses this server's location (451)"**: Binance blocked the relay's address. Test with
  `curl -s https://api.binance.com/api/v3/ping` on the relay; a 451 means the address (or its datacenter range) is
  refused, so move the relay (new droplet in another European region) and update the API key's IP restriction.
- **"Binance answered 400 (code -2015)"**: the key was deleted, lost its _Enable Reading_, or its IP restriction no
  longer matches the relay's address. Fix it in Binance → API Management.
- **"site: POST … answered 401"**: `BINANCE_RELAY_SECRET` differs between the relay and the site, or the relay's
  clock is more than two minutes off (`timedatectl`).
- **Rotating the relay secret:** set the same new value in the site's `server.env` (and restart the site's containers)
  and in `relay.env`, then `sudo systemctl restart looma-relay`.
