# NOSI

**Network Observation & Status Interface.** Lightweight infrastructure monitoring.
A tiny shell agent on every host POSTs a
resource heartbeat once a minute; this app stores the series and renders a live
dashboard, per-host metrics, and a world map of the fleet.

A ground-up rewrite of the original Node/Express + MariaDB NOSI.

## Stack

| Layer      | Choice                                            |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 16 (App Router, React 19)                 |
| UI         | Tailwind CSS v4 + shadcn/ui (base-ui)             |
| DB         | Postgres via Drizzle ORM                          |
| Dev DB     | Local Postgres (embedded PGlite as a fallback)    |
| Charts     | Recharts · Map: d3-geo + world-atlas TopoJSON     |
| Agent      | POSIX `sh` + `curl`, systemd timer                |

## Local development

Point `DATABASE_URL` at any Postgres, then:

```bash
npm install
cp .env.example .env.local        # set DATABASE_URL
npm run db:migrate                # create tables
npm run db:seed                   # optional: demo fleet + history
npm run dev                       # http://localhost:3000
```

No Postgres handy? Leave `DATABASE_URL` blank and NOSI uses an embedded
PGlite database at `./.pglite`. It is single-process, so run the CLI
scripts with the dev server stopped, and don't rely on it beyond a quick look.

To watch it update live, in a second terminal:

```bash
npm run demo:agents               # simulated agents POSTing every 15s
```

Admin login password is `admin` by default (`.env.local`).

## Scripts

| Script               | What                                            |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Dev server on :3000                             |
| `npm run build`      | Production build (`output: standalone`)         |
| `npm run db:generate`| Generate SQL migration from `src/db/schema.ts`  |
| `npm run db:migrate` | Apply migrations to the configured database     |
| `npm run db:seed`    | Load a demo fleet with a few hours of history   |
| `npm run db:studio`  | Drizzle Studio                                  |
| `npm run demo:agents`| Simulate live agents against a running instance |
| `npm run typecheck`  | `tsc --noEmit`                                  |

## Configuration

See [`.env.example`](.env.example). Key vars: `DATABASE_URL` (blank = PGlite),
`INGEST_TOKEN` (agents authenticate with this), `ADMIN_PASSWORD`, `SESSION_SECRET`.

## HTTP API

| Method | Path                          | Auth          | Purpose                     |
| ------ | ----------------------------- | ------------- | --------------------------- |
| `POST` | `/api/report`                 | Bearer token  | Agent submits a heartbeat   |
| `GET`  | `/api/hosts`                  | public        | Latest snapshot per host    |
| `GET`  | `/api/hosts/{hostname}`       | public        | Host detail + metric series |
| `PATCH`| `/api/hosts/{hostname}`       | admin cookie  | Set label / lat / lon       |
| `DELETE`| `/api/hosts/{hostname}`      | admin cookie  | Remove host + heartbeats    |

### Heartbeat payload

```json
{
  "host": "web-1.example.com",
  "time": 1725530400,
  "cpu_pct": 12.4,
  "mem_total_kb": 8069120,
  "mem_used_kb": 3465216,
  "disk_total_kb": 49283072,
  "disk_free_kb": 34816000,
  "load1": 0.12, "load5": 0.09, "load15": 0.05,
  "uptime_s": 812345
}
```

## Deploying

See [DEPLOY.md](DEPLOY.md) — Docker Compose or bare Node behind nginx/Caddy.

## Agent

See [agent/README.md](agent/README.md). One-liner is on the in-app **Admin** page.
