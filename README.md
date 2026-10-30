# Spendwise · Expense Tracker

A full-stack expense tracker with user accounts, a spending dashboard and a searchable, filterable transaction history.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · React Router · TanStack Query · React Hook Form · Recharts · Express 5 · Prisma 7 · PostgreSQL · Zod · Pino

The project is an npm workspaces monorepo with three packages: `client`, `server` and `shared`.

## Features

- **Accounts:** sign up and log in, with sessions held in an httpOnly cookie. Every query is scoped to the signed-in user.
- **Default categories:** each new account starts with Food, Transportation, Entertainment, Utilities, Healthcare, Shopping and Other, each with its own colour and icon.
- **Dashboard:** summary cards (total spent, this month vs last month, transaction count, top category), a 12-month spending chart and a category breakdown, for this month, the last 3 months, this year or all time.
- **Transactions:** search, filter by category and date range, sort by date, description or amount, and page through results. Filters are stored in the URL, so a filtered view can be bookmarked or shared.
- **Add, edit and delete** expenses in dialogs, with validation and an undo option after deleting. Amounts are shown in South African rand (ZAR).
- **Light and dark mode**, a responsive layout from phone to desktop, and accessible components (keyboard navigation, labels, focus states).

## Architecture

```
shared/   Zod schemas, TypeScript types and default categories, used by both client and server
  src/index.ts
server/   Express API
  prisma/          schema, migrations, seed script
  src/app.ts       Express app: security headers, logging, rate limits, routes, static client
  src/server.ts    starts the HTTP server and shuts it down cleanly on SIGTERM/SIGINT
  src/config/      environment variables, validated at startup
  src/routes/      URL → controller mapping and middleware per router
  src/controllers/ parse and validate the request, call a service, send the response
  src/services/    business logic and database access
  src/middleware/  auth guard, central error handler
  src/db/          Prisma client (PostgreSQL driver adapter)
  src/lib/         JWT helpers, date helpers, error classes, logger
  src/generated/   generated Prisma client (not committed; created by `prisma generate`)
client/   React single-page app
  src/hooks/       TanStack Query hooks, one per resource
  src/pages/       route components (lazy-loaded where heavy)
  src/lib/         API client, query client, formatting helpers
  src/components/  feature components (auth, dashboard, expenses, layout) + shadcn/ui primitives
```

Design decisions:

- **Validation is shared.** The request schemas in `shared/` validate forms in the browser and requests on the server, so the two sets of rules can't drift apart.
- **Money is stored as integer cents** (`amount_cents INT`), never as floating-point numbers.
- **Expense dates are calendar dates** (Postgres `DATE`), so they don't shift between timezones.
- **Errors use one format:** `{ error: { code, message, details? } }`. Validation errors list each failing field, and the client shows them next to the matching input.
- **Sessions use a JWT in an httpOnly, SameSite=Lax cookie.** JavaScript on the page can't read the token, and the cookie isn't sent on requests from other sites.
- **In production, the API serves the built client** from the same origin, so there's one service to deploy and no CORS setup. CORS is only enabled when `CORS_ORIGIN` is set.
- **Rate limiting:** register and login allow 20 attempts per 15 minutes; the rest of the API allows 500 requests per 15 minutes. Limited requests get a `429` with code `RATE_LIMITED`.
- **Hardening:** Helmet sets security headers, JSON bodies are capped at 100 kB, and passwords are hashed with bcrypt.
- **Structured logging** with Pino, pretty-printed in development. Cookies and auth headers are redacted from logs.

## API

All routes are under `/api/v1`. Every route except register and login requires a session.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create an account (also logs in) |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Log out |
| GET | `/auth/me` | Current user |
| GET | `/categories` | The user's categories |
| GET | `/expenses` | List expenses. Query: `categoryId, from, to, q, sort, order, page, pageSize` |
| GET | `/expenses/summary` | Totals, per-category totals and monthly totals. Accepts the same filters as the list |
| POST | `/expenses` | Create `{ description, amountCents, categoryId, date }` |
| PATCH | `/expenses/:id` | Update any of those fields |
| DELETE | `/expenses/:id` | Delete an expense |

List results are paginated: `pageSize` defaults to 20 (maximum 100), `sort` defaults to `date` and `order` to `desc`. Amounts are limited to R10 000 000.00 per expense.

`GET /healthz` checks that the database is reachable.

## Getting started

**Prerequisites:** Node.js 22.12 or later, and a PostgreSQL database (local, or a free hosted one from [Neon](https://neon.tech) or [Supabase](https://supabase.com)).

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Configure the server
cp server/.env.example server/.env
#    then set DATABASE_URL and JWT_SECRET (openssl rand -base64 48)

# 3. Create the tables and load demo data
npm run db:migrate
npm run db:seed        # demo@example.com / password123

# 4. Start the API (port 8000) and the client (port 5173)
npm run dev
```

Open http://localhost:5173. In development, Vite forwards `/api` requests to the API.

### Environment variables (`server/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | | PostgreSQL connection string |
| `JWT_SECRET` | yes | | Signs session tokens; at least 32 characters |
| `NODE_ENV` | no | `development` | `development`, `test` or `production` |
| `PORT` | no | `8000` | API port |
| `DATABASE_POOL_MAX` | no | `10` | Max database connections; keep low on free-tier Postgres |
| `CORS_ORIGIN` | no | | Comma-separated origins, only needed if the client runs on a different origin |
| `LOG_LEVEL` | no | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |

The server exits at startup with a list of problems if any value is missing or invalid.

On macOS, a local Postgres can be set up with:

```bash
brew install postgresql@17 && brew services start postgresql@17
createdb expense_tracker
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API and client in watch mode |
| `npm run build` | Build the client and bundle the server |
| `npm start` | Run the production build (serves the client too) |
| `npm run typecheck` | Type-check all workspaces |
| `npm run db:migrate` | Create or apply migrations in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Reset and seed the demo account |
| `npm run db:studio` | Open Prisma Studio |

