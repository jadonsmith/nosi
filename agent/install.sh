#!/bin/sh
# Install the NOSI agent as a systemd timer (run as root on each host).
#
#   NOSI_URL=https://nosi.example.com NOSI_TOKEN=xxxx ./install.sh
#
# Falls back to printing a cron line if systemd is not present.
set -eu

NOSI_URL="${NOSI_URL:-}"
NOSI_TOKEN="${NOSI_TOKEN:-}"
NOSI_HOST="${NOSI_HOST:-}"

if [ -z "$NOSI_URL" ] || [ -z "$NOSI_TOKEN" ]; then
  echo "Set NOSI_URL and NOSI_TOKEN, e.g.:" >&2
  echo "  NOSI_URL=https://nosi.example.com NOSI_TOKEN=xxxx $0" >&2
  exit 2
fi

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

echo "→ installing /usr/local/bin/nosi-agent.sh"
if [ -f "$SCRIPT_DIR/../public/nosi-agent.sh" ]; then
  install -m 0755 "$SCRIPT_DIR/../public/nosi-agent.sh" /usr/local/bin/nosi-agent.sh
else
  curl -fsSL "$NOSI_URL/nosi-agent.sh" -o /usr/local/bin/nosi-agent.sh
  chmod 0755 /usr/local/bin/nosi-agent.sh
fi

echo "→ writing /etc/nosi/agent.env"
mkdir -p /etc/nosi
{
  echo "NOSI_URL=$NOSI_URL"
  echo "NOSI_TOKEN=$NOSI_TOKEN"
  [ -n "$NOSI_HOST" ] && echo "NOSI_HOST=$NOSI_HOST"
} > /etc/nosi/agent.env
chmod 0600 /etc/nosi/agent.env

if command -v systemctl >/dev/null 2>&1; then
  echo "→ installing systemd units"
  install -m 0644 "$SCRIPT_DIR/nosi-agent.service" /etc/systemd/system/nosi-agent.service
  install -m 0644 "$SCRIPT_DIR/nosi-agent.timer" /etc/systemd/system/nosi-agent.timer
  systemctl daemon-reload
  systemctl enable --now nosi-agent.timer
  echo "→ sending one heartbeat now"
  systemctl start nosi-agent.service || true
  echo "done. check: systemctl list-timers nosi-agent.timer"
else
  echo "systemd not found — add this to root's crontab instead:"
  echo "  * * * * * set -a; . /etc/nosi/agent.env; set +a; /usr/local/bin/nosi-agent.sh >/dev/null 2>&1"
fi
