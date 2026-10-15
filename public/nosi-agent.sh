#!/bin/sh
# ─────────────────────────────────────────────────────────────
# NOSI heartbeat agent. POSIX sh, no dependencies beyond `curl`.
# Collects CPU / memory / disk / load and POSTs one heartbeat.
#
#   NOSI_URL=https://nosi.example.com \
#   NOSI_TOKEN=xxxxxxxx \
#   ./nosi-agent.sh
#
# Optional:
#   NOSI_HOST      override the reported hostname
#   NOSI_DISK_PATH filesystem to report (default: /)
# ─────────────────────────────────────────────────────────────
set -eu

NOSI_URL="${NOSI_URL:-}"
NOSI_TOKEN="${NOSI_TOKEN:-}"
NOSI_HOST="${NOSI_HOST:-$(hostname -f 2>/dev/null || hostname)}"
NOSI_DISK_PATH="${NOSI_DISK_PATH:-/}"

if [ -z "$NOSI_URL" ] || [ -z "$NOSI_TOKEN" ]; then
  echo "nosi-agent: NOSI_URL and NOSI_TOKEN must be set" >&2
  exit 2
fi

# ── memory (KiB) ────────────────────────────────────────────
mem_total_kb=$(awk '/^MemTotal:/{print $2}' /proc/meminfo)
mem_avail_kb=$(awk '/^MemAvailable:/{print $2}' /proc/meminfo)
mem_used_kb=$((mem_total_kb - mem_avail_kb))

# ── cpu %: two samples of /proc/stat ~1s apart ─────────────
read_cpu() {
  awk '/^cpu /{
    idle = $5 + $6
    total = 0
    for (i = 2; i <= NF; i++) total += $i
    print idle, total
  }' /proc/stat
}
set -- $(read_cpu); idle1=$1; total1=$2
sleep 1
set -- $(read_cpu); idle2=$1; total2=$2
d_idle=$((idle2 - idle1))
d_total=$((total2 - total1))
if [ "$d_total" -gt 0 ]; then
  cpu_pct=$(awk -v di="$d_idle" -v dt="$d_total" 'BEGIN{ printf "%.1f", (1 - di/dt) * 100 }')
else
  cpu_pct="0.0"
fi

# ── disk (KiB) ─────────────────────────────────────────────
set -- $(df -k -P "$NOSI_DISK_PATH" | awk 'NR==2{print $2, $4}')
disk_total_kb=$1
disk_free_kb=$2

# ── load + uptime ─────────────────────────────────────────
load1=$(awk '{print $1}' /proc/loadavg)
load5=$(awk '{print $2}' /proc/loadavg)
load15=$(awk '{print $3}' /proc/loadavg)
uptime_s=$(awk '{print int($1)}' /proc/uptime)
now=$(date +%s)

payload=$(printf '{"host":"%s","time":%s,"cpu_pct":%s,"mem_total_kb":%s,"mem_used_kb":%s,"disk_total_kb":%s,"disk_free_kb":%s,"load1":%s,"load5":%s,"load15":%s,"uptime_s":%s}' \
  "$NOSI_HOST" "$now" "$cpu_pct" "$mem_total_kb" "$mem_used_kb" \
  "$disk_total_kb" "$disk_free_kb" "$load1" "$load5" "$load15" "$uptime_s")

exec curl -fsS --max-time 15 \
  -H "Authorization: Bearer $NOSI_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$NOSI_URL/api/report" \
  -d "$payload"
