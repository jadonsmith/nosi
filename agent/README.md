# NOSI agent

A ~60-line POSIX shell script. The only runtime dependency is `curl`.
It reads `/proc` and `df`, so it targets Linux hosts.

## Install (systemd timer, recommended)

On each host, as root:

```sh
NOSI_URL=https://nosi.jadon.me NOSI_TOKEN=<ingest-token> ./install.sh
```

This installs `/usr/local/bin/nosi-agent.sh`, writes `/etc/nosi/agent.env`,
and enables a `nosi-agent.timer` that fires every 60s.

Check it:

```sh
systemctl list-timers nosi-agent.timer
journalctl -u nosi-agent.service -n 20
```

## Install (cron, no systemd)

```sh
curl -fsSL https://nosi.jadon.me/nosi-agent.sh -o /usr/local/bin/nosi-agent.sh
chmod +x /usr/local/bin/nosi-agent.sh
mkdir -p /etc/nosi
printf 'NOSI_URL=%s\nNOSI_TOKEN=%s\n' https://nosi.jadon.me <ingest-token> > /etc/nosi/agent.env
chmod 600 /etc/nosi/agent.env

# root crontab
* * * * * set -a; . /etc/nosi/agent.env; set +a; /usr/local/bin/nosi-agent.sh >/dev/null 2>&1
```

## Environment

| Var              | Required | Default                  | Meaning                        |
| ---------------- | -------- | ------------------------ | ------------------------------ |
| `NOSI_URL`       | yes      | —                        | Base URL of the NOSI server    |
| `NOSI_TOKEN`     | yes      | —                        | Shared ingest bearer token     |
| `NOSI_HOST`      | no       | `hostname -f`            | Reported hostname              |
| `NOSI_DISK_PATH` | no       | `/`                      | Filesystem to report usage for |

## Uninstall

```sh
systemctl disable --now nosi-agent.timer
rm -f /etc/systemd/system/nosi-agent.{service,timer} /usr/local/bin/nosi-agent.sh
rm -rf /etc/nosi
systemctl daemon-reload
```
