#!/usr/bin/env bash
# Installs the server-side files kept in git (deploy/ — the compose file, Caddyfile and
# scripts) onto the server, so the repository stays the single source of truth.
# CI sends them as a tar.gz on stdin before every deploy:
#
#   tar -czf - -C deploy . | ssh deploy@server sync
#
# Only the files named below are ever installed, whatever the archive contains. The
# running site is never touched here: a changed Caddyfile is validated and then
# applied with a graceful reload; if it does not validate, the previous one is put back.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sentencestep}"
cd "$APP_DIR"

SCRIPTS=(lib.sh deploy.sh rollback.sh status.sh ci-entry.sh sync.sh smoke-test.sh)
CONFIGS=(docker-compose.yml active-upstream.caddy.example)
# The Caddyfile lives in Caddy's config directory, which the container mounts as a whole
# (see docker-compose.yml: a replaced file is only seen through a directory mount).
CADDY_DIR="$APP_DIR/caddy"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
tar -xz -C "$tmp" --no-same-owner --no-same-permissions

mkdir -p "$CADDY_DIR"
changed_caddyfile=0
if [ -f "$tmp/Caddyfile" ] && ! cmp -s "$tmp/Caddyfile" "$CADDY_DIR/Caddyfile"; then
  changed_caddyfile=1
  cp -p "$CADDY_DIR/Caddyfile" "$tmp/Caddyfile.previous" 2>/dev/null || true
  install -m 644 "$tmp/Caddyfile" "$CADDY_DIR/Caddyfile"
fi

for f in "${CONFIGS[@]}"; do
  [ -f "$tmp/$f" ] && install -m 644 "$tmp/$f" "$APP_DIR/$f"
done

if [ "$changed_caddyfile" -eq 1 ]; then
  if docker compose --project-directory "$APP_DIR" -f "$APP_DIR/docker-compose.yml" ps --status running --services 2>/dev/null | grep -qx caddy; then
    if docker exec sentencestep-caddy-1 caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1 \
       && docker exec sentencestep-caddy-1 caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
      echo "Caddyfile updated and reloaded"
    else
      [ -f "$tmp/Caddyfile.previous" ] && install -m 644 "$tmp/Caddyfile.previous" "$CADDY_DIR/Caddyfile"
      echo "ERROR: the new Caddyfile was rejected; the previous one was restored" >&2
      exit 1
    fi
  else
    echo "Caddyfile updated (Caddy is not running yet, nothing to reload)"
  fi
fi

# Scripts last, in one step each: `install` replaces a file by creating a new one, so a
# script that is running right now (this one included) keeps reading its old copy.
for f in "${SCRIPTS[@]}"; do
  [ -f "$tmp/$f" ] && install -m 755 "$tmp/$f" "$APP_DIR/$f"
done

echo "deploy files synced"
