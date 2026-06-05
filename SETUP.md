# Local Development Setup

How to get the NestBoard API running on your machine — including the **database**, so you can develop and test the backend locally.

> **When you need this**: from **Session 09 (Database I)** onward, the API talks to PostgreSQL. Before that (Sessions 07–08) there's no database and you can skip straight to [Run it](#5-run-it). Everything below assumes you're on the `session-09` branch or later.

---

## Prerequisites

- **Node.js 22+** and npm — check with `node -v`.
- **Git**.
- **A PostgreSQL database** — pick one:
  - **Option A — Docker** (recommended): [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running. Matches the lessons exactly, works offline.
  - **Option B — Free cloud Postgres** (fallback): a [Neon](https://neon.tech) account (or Supabase / Railway). Use this if Docker won't install or your machine is locked down. Needs internet.

---

## TL;DR

```bash
git clone <repo-url> nestboard-api && cd nestboard-api
npm install

# Database — Option A (Docker):
docker compose up -d postgres

# .env (see template below), then:
npx prisma migrate dev      # create the schema
npm run seed                # load sample data
npm run dev                 # http://localhost:3001
```

If anything errors, see [Troubleshooting](#troubleshooting).

---

## 1. Clone & install

```bash
git clone <repo-url> nestboard-api
cd nestboard-api
git checkout session-09        # or the session you're working from
npm install
```

## 2. Start a database

### Option A — Local Postgres via Docker (recommended)

The repo ships a `docker-compose.yml` (from Session 09). Start it:

```bash
docker compose up -d postgres
docker compose ps              # STATUS should say "healthy"
```

This runs Postgres 16 on `localhost:5432` with user/password/db all set to `nestboard`. Data persists in a Docker volume across restarts. Stop it with `docker compose stop postgres` (keeps data) or `docker compose down -v` (wipes data).

> Don't have the compose file yet (older branch)? Copy the one in [Appendix A](#appendix-a-docker-composeyml) into the repo root.

### Option B — Free cloud Postgres (fallback)

If Docker isn't an option, get a free hosted database:

1. Sign up at [neon.tech](https://neon.tech) (free tier is plenty). Create a project.
2. Copy the **connection string** it gives you. It looks like:
   ```
   postgresql://<user>:<password>@<host>.neon.tech/<db>?sslmode=require
   ```
3. Use that as your `DATABASE_URL` in step 3. **Keep `?sslmode=require`** — cloud Postgres needs SSL.

Supabase and Railway work the same way — create a Postgres instance, copy its connection string.

> Cloud DBs are shared over the internet: slower than local, and **never commit the connection string** (it contains your password). It stays in `.env`, which is git-ignored.

## 3. Configure `.env`

Create a file named `.env` in the repo root. `.env` is git-ignored — never commit it.

```bash
# .env — local development
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Option A (Docker):
DATABASE_URL="postgresql://nestboard:nestboard@localhost:5432/nestboard?schema=public"
# Option B (cloud): paste your Neon/Supabase/Railway string instead, e.g.
# DATABASE_URL="postgresql://user:pass@host.neon.tech/nestboard?sslmode=require"

# Added in Session 10 (auth). Any long random string — generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET="replace-with-a-32+-char-random-string"
```

> `JWT_ACCESS_SECRET` only matters from Session 10. On `session-09` you can omit it.

## 4. Create the schema & load data

```bash
npx prisma migrate dev     # applies migrations → your DB now has the tables
npm run seed               # loads 1 vendor + 3 tenants + 12 properties with rooms
```

- `migrate dev` reads `prisma/schema.prisma`, applies the committed migrations, and regenerates the typed Prisma client. First run on an empty DB creates everything.
- `npm run seed` is **idempotent** — safe to run again; it won't duplicate data.
- Inspect what you've got with the built-in GUI:
  ```bash
  npx prisma studio        # opens http://localhost:5555
  ```

## 5. Run it

```bash
npm run dev                # tsx watch — auto-reloads on save
```

Verify in another terminal:

```bash
curl -i http://localhost:3001/api/health/live          # → 200
curl -s http://localhost:3001/api/properties | head    # → JSON array of properties (from L9 on)
```

---

## Daily workflow

```bash
docker compose up -d postgres    # (Option A) make sure the DB is running
npm run dev                      # start the API
```

When you `git pull` and someone added a migration:

```bash
npx prisma migrate dev           # applies any new migrations
```

## Resetting the database

Wiped state, start fresh (drops all data, re-applies migrations, re-seeds):

```bash
npx prisma migrate reset         # asks for confirmation; then runs the seed automatically
```

Use this freely in local dev — it's the "undo button." **Never** run it against a shared/production DB.

---

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `Error: P1001: Can't reach database server` | DB isn't running. Option A: `docker compose up -d postgres` and wait for "healthy". Option B: check the cloud string + internet. |
| `bind: address already in use` / port 5432 taken | Another Postgres is on 5432. Either stop it, or change the host port in `docker-compose.yml` (`"5433:5432"`) and update `DATABASE_URL` to `:5433`. |
| `Cannot connect to the Docker daemon` | Docker Desktop isn't running. Open it, wait for the whale icon to settle, retry. |
| Cloud DB: `no pg_hba.conf entry` / SSL error | Add `?sslmode=require` to the end of your `DATABASE_URL`. |
| `Environment variable not found: DATABASE_URL` | No `.env`, or it's not in the repo root. Create it (step 3). |
| `npm run seed` → "script not found" | You're on a branch before Session 09 (no seed yet). Check out `session-09`+. |
| `migrate dev` → "drift detected" | The DB was changed outside migrations. Local only: `npx prisma migrate reset`. |
| Migration applied but client types are stale | `npx prisma generate`, then restart `npm run dev`. |
| `EADDRINUSE :3001` | The API is already running in another terminal, or change `PORT` in `.env`. |

Still stuck? Post your error in the cohort chat with the **full** terminal output and which option (Docker / cloud) you're on.

---

## Appendix A — `docker-compose.yml`

If your branch doesn't have it yet, create this in the repo root:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: nestboard-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: nestboard
      POSTGRES_PASSWORD: nestboard
      POSTGRES_DB: nestboard
    ports:
      - "5432:5432"
    volumes:
      - nestboard-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nestboard"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  nestboard-pgdata:
```
