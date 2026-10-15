# Deploying NOSI

## jadon.me (how production actually runs)

Every push to `master` triggers `.github/workflows/image.yml`, which builds the
image on GitHub and publishes `ghcr.io/jadonsmith/nosi:latest` (public). The
droplet never builds — it only pulls:

```bash
ssh jadon.me 'cd ~/nosi && docker compose pull app && docker compose up -d'
```

`~/nosi` on the server holds `docker-compose.yml`, a
`docker-compose.override.yml` (GHCR image, `nosi-app` on the shared `web`
network, no host port) and `.env`. Migrations run automatically on container
start. Caddy (in `~/infra`) routes `nosi.jadon.me` → `nosi-app:3000`.

The sections below are the generic self-hosting options.

Two supported paths. Both assume a Linux box reachable over SSH and a domain
(e.g. `nosi.jadon.me`) pointed at it.

---

## Option A — Docker Compose (recommended)

On the server:

```bash
git clone <this-repo> nosi && cd nosi

cat > .env <<'EOF'
POSTGRES_PASSWORD=$(openssl rand -hex 16)
INGEST_TOKEN=$(openssl rand -hex 24)
ADMIN_PASSWORD=<pick-something>
SESSION_SECRET=$(openssl rand -hex 32)
NOSI_GEOLOCATE=true
EOF

docker compose up -d --build
```

`docker compose` runs Postgres, builds the app image, applies migrations on
start, and serves on `127.0.0.1:3000`. Put a reverse proxy in front for TLS.

### Caddy (automatic HTTPS)

```
# /etc/caddy/Caddyfile
nosi.jadon.me {
    reverse_proxy 127.0.0.1:3000
}
```

### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name nosi.jadon.me;
    ssl_certificate     /etc/letsencrypt/live/nosi.jadon.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nosi.jadon.me/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The `X-Forwarded-*` headers matter: NOSI uses them for the client IP
(map geolocation) and to build the agent install snippet on the Admin page.

### Updating

```bash
git pull && docker compose up -d --build
```

---

## Option B — bare Node + systemd

Requires Node 24+ and a reachable Postgres.

```bash
git clone <this-repo> nosi && cd nosi
npm ci

cat > .env <<'EOF'
DATABASE_URL=postgres://nosi:PASS@localhost:5432/nosi
INGEST_TOKEN=...
ADMIN_PASSWORD=...
SESSION_SECRET=...
EOF

npm run build
npm run db:migrate
```

`/etc/systemd/system/nosi.service`:

```ini
[Unit]
Description=NOSI
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
WorkingDirectory=/opt/nosi
EnvironmentFile=/opt/nosi/.env
ExecStartPre=/usr/bin/npm run db:migrate
ExecStart=/usr/bin/node .next/standalone/server.js
Environment=PORT=3000
Restart=on-failure
User=nosi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now nosi
```

Copy `.next/static` and `public/` next to `.next/standalone` if you relocate the
build:

```bash
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

Then reverse-proxy `127.0.0.1:3000` as in Option A.

---

## Push-to-deploy over SSH

`scripts/deploy.sh` (Option A servers): rsync the tree and rebuild.

```bash
NOSI_SSH=jadon@nosi.jadon.me NOSI_PATH=/opt/nosi ./scripts/deploy.sh
```

---

## After it's up

1. Open `https://nosi.jadon.me`, sign in at **Admin**, copy the install snippet.
2. Run it on each host (see [agent/README.md](agent/README.md)).
3. Hosts appear on the dashboard within a minute.
