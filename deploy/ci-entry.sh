#!/usr/bin/env bash
# The ONLY thing the CI deploy key is allowed to run. In the deploy user's
# ~/.ssh/authorized_keys the key is pinned to this script:
#
#   command="/opt/sentencestep/ci-entry.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding ssh-ed25519 AAAA... ci-deploy
#
# so a leaked key cannot open a shell — it can sync the deploy files, deploy, roll back or ask for status, and nothing else.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sentencestep}"

case "${SSH_ORIGINAL_COMMAND:-}" in
  "deploy "*)
    sha="${SSH_ORIGINAL_COMMAND#deploy }"
    exec "$APP_DIR/deploy.sh" "$sha"
    ;;
  sync)
    exec "$APP_DIR/sync.sh"
    ;;
  rollback)
    exec "$APP_DIR/rollback.sh"
    ;;
  status)
    exec "$APP_DIR/status.sh"
    ;;
  *)
    echo "command not allowed" >&2
    exit 1
    ;;
esac
