# Spendwise · Expense Tracker

A full-stack expense tracker with user accounts, a spending dashboard and a searchable, filterable transaction history.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · TanStack Query · Recharts · Express 5 · Prisma 7 · PostgreSQL · Zod

## Features

- **Accounts:** sign up and log in, with sessions held in an httpOnly cookie. Every query is scoped to the signed-in user.
- **Dashboard:** summary cards (total spent, this month vs last month, transaction count, top category), a 12-month spending chart and a category breakdown, for this month, the last 3 months, this year or all time.
- **Transactions:** search, filter by category and date range, sort by date, description or amount, and page through results. Filters are stored in the URL, so a filtered view can be bookmarked or shared.
- **Add, edit and delete** expenses in dialogs, with validation and an undo option after deleting.
- **Light and dark mode**, a responsive layout from phone to desktop, and accessible components (keyboard navigation, labels, focus states).

## Architecture

```
shared/   Zod schemas and TypeScript types, used by both client and server
server/   Express API
  prisma/         schema, migrations, seed script
  src/config/     environment variables, validated at startup
  src/routes/     URL → controller mapping and middleware per router
  src/controllers/ parse and validate the request, call a service, send the response
  src/services/   business logic and database access
  src/middleware/ auth guard, central error handler
client/   React single-page app
  src/hooks/      TanStack Query hooks, one per resource
  src/pages/      route components (lazy-loaded where heavy)
  src/components/ feature components + shadcn/ui primitives
```

Design decisions:

- **Validation is shared.** The request schemas in `shared/` validate forms in the browser and requests on the server, so the two sets of rules can't drift apart.
- **Money is stored as integer cents** (`amount_cents INT`), never as floating-point numbers.
- **Expense dates are calendar dates** (Postgres `DATE`), so they don't shift between timezones.
- **Errors use one format:** `{ error: { code, message, details? } }`. Validation errors list each failing field, and the client shows them next to the matching input.
- **Sessions use a JWT in an httpOnly, SameSite=Lax cookie.** JavaScript on the page can't read the token, and the cookie isn't sent on requests from other sites.
- **In production, the API serves the built client** from the same origin, so there's one service to deploy and no CORS setup.

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

## Deploying

The app deploys as a single Node service (Render, Railway or Fly.io) plus a Postgres database.

- **Build command:** `npm ci && npm run build`
- **Start command:** `npm run db:deploy && npm start`
- **Environment:** `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, plus `DATABASE_POOL_MAX` if your database limits connections
