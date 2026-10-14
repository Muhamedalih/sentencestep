#!/usr/bin/env bash
# One-time setup of a brand-new Ubuntu 24.04 server for the site. Run as root, once,
# right after creating the machine:
#
#   scp -r deploy root@SERVER:/root/deploy
#   ssh root@SERVER "bash /root/deploy/bootstrap-server.sh 'ssh-ed25519 AAAA... your-key' 'ssh-ed25519 AAAA... ci-deploy'"
#
# Arguments: <admin public key> <CI deploy public key>. The admin key gets a normal
# login for the `deploy` user (for people); the CI key is pinned to ci-entry.sh and
# can do nothing else. Safe to run again (every step checks before it changes).
#
# What it sets up: Docker; the `deploy` user; key-only SSH with root login and
# passwords off; automatic security updates; fail2ban; a small swap file; log
# rotation; /opt/sentencestep with the stack's files. It does NOT start the site —
# that needs the secrets in server.env and the Cloudflare certificate (README.md).
#
# Note for whoever extends it: Docker publishes ports straight through the firewall
# (ufw's rules do not apply to published container ports). Restricting who may
# reach 80/443 is therefore done in Docker's own DOCKER-USER chain by
# cloudflare-firewall.sh (installed below, root-owned, refreshed daily) and, as an
# optional second layer, in the cloud provider's firewall (README.md, "Firewall").
set -euo pipefail

ADMIN_KEY="${1:-}"
CI_KEY="${2:-}"
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }
[[ "$ADMIN_KEY" == ssh-* && "$CI_KEY" == ssh-* ]] || { echo "usage: $0 '<admin public key>' '<ci deploy public key>'" >&2; exit 1; }

APP_DIR=/opt/sentencestep
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DEBIAN_FRONTEND=noninteractive

echo "==> packages"
apt-get update -y
apt-get -o Dpkg::Options::=--force-confold upgrade -y
apt-get install -y ca-certificates curl gnupg jq ufw fail2ban unattended-upgrades logrotate ipset

echo "==> Docker (official repository)"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
mkdir -p /etc/docker
cat >/etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "20m", "max-file": "5" },
  "live-restore": true
}
EOF
systemctl enable --now docker
systemctl reload docker || systemctl restart docker

echo "==> deploy user"
if ! id deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi
usermod -aG docker deploy
# The people who administer the server (the admin key) can use sudo without a password
# prompt; the CI key cannot reach a shell at all (it is pinned to ci-entry.sh below).
echo 'deploy ALL=(ALL) NOPASSWD:ALL' >/etc/sudoers.d/90-deploy
chmod 440 /etc/sudoers.d/90-deploy
visudo -cf /etc/sudoers.d/90-deploy >/dev/null
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
{
  echo "$ADMIN_KEY"
  echo "command=\"$APP_DIR/ci-entry.sh\",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding $CI_KEY"
} >/home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# SSH hardening is a SECOND stage on purpose: first prove that `ssh deploy@server` works
# with the admin key, and only then close root login (a mistake here would otherwise
# lock everyone out). Run the script again with HARDEN_SSH=1 after checking the login.
if [ "${HARDEN_SSH:-0}" = "1" ]; then
  echo "==> SSH hardening (keys only, no root, no passwords)"
  cat >/etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
MaxAuthTries 3
LoginGraceTime 20
X11Forwarding no
EOF
  sshd -t
  systemctl reload ssh || systemctl reload sshd
else
  echo "==> SSH hardening skipped (stage 1). Once 'ssh deploy@<server>' works, run again with HARDEN_SSH=1."
fi

echo "==> fail2ban"
cat >/etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
maxretry = 4
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "==> automatic security updates (no automatic reboot)"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
cat >/etc/apt/apt.conf.d/52unattended-upgrades-local <<'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF

echo "==> host firewall: SSH, HTTP, HTTPS (who may reach 80/443 is set in the cloud firewall)"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 2 GB swap (a safety net against out-of-memory kills)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi
cat >/etc/sysctl.d/99-sentencestep.conf <<'EOF'
vm.swappiness = 10
net.core.somaxconn = 1024
EOF
sysctl --system >/dev/null

echo "==> $APP_DIR"
# caddy/ is the directory the Caddy container mounts as /etc/caddy (a directory, not single
# files, so that files replaced by rename are seen - see docker-compose.yml).
install -d -m 755 -o deploy -g deploy "$APP_DIR" "$APP_DIR/caddy" "$APP_DIR/caddy/certs"
for f in docker-compose.yml lib.sh deploy.sh rollback.sh status.sh ci-entry.sh sync.sh smoke-test.sh watchdog.sh active-upstream.caddy.example; do
  install -m 755 -o deploy -g deploy "$SRC_DIR/$f" "$APP_DIR/$f"
done
# The watchdog restarts an app container that hangs (Docker only marks it unhealthy).
install -m 644 "$SRC_DIR/systemd/sentencestep-watchdog.service" "$SRC_DIR/systemd/sentencestep-watchdog.timer" /etc/systemd/system/
# Only Cloudflare may reach ports 80/443. The script is owned by root and kept OUT of
# /opt/sentencestep on purpose: root runs it, so the deploy user (and the CI key) must not
# be able to replace it. It fails open if Cloudflare's list cannot be fetched.
install -m 755 -o root -g root "$SRC_DIR/cloudflare-firewall.sh" /usr/local/sbin/sentencestep-firewall
install -m 644 "$SRC_DIR/systemd/sentencestep-firewall.service" "$SRC_DIR/systemd/sentencestep-firewall.timer" "$SRC_DIR/systemd/sentencestep-firewall-refresh.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now sentencestep-watchdog.timer
systemctl enable --now sentencestep-firewall.service sentencestep-firewall.timer
chmod 644 "$APP_DIR/docker-compose.yml" "$APP_DIR/active-upstream.caddy.example"
install -m 644 -o deploy -g deploy "$SRC_DIR/Caddyfile" "$APP_DIR/caddy/Caddyfile"
if [ ! -f "$APP_DIR/caddy/active-upstream.caddy" ]; then
  install -m 644 -o deploy -g deploy "$SRC_DIR/active-upstream.caddy.example" "$APP_DIR/caddy/active-upstream.caddy"
fi
if [ ! -f "$APP_DIR/server.env" ]; then
  install -m 600 -o deploy -g deploy "$SRC_DIR/server.env.example" "$APP_DIR/server.env"
  echo "    created $APP_DIR/server.env from the example — fill in the real values (README.md, step 4)"
fi

echo
echo "Bootstrap finished. Next (README.md): put the Cloudflare origin certificate in $APP_DIR/caddy/certs,"
echo "fill in $APP_DIR/server.env, then start Caddy:  cd $APP_DIR && docker compose up -d caddy"
echo "Log in as:  ssh deploy@<server>. Root login is closed only by the second stage (HARDEN_SSH=1)."
