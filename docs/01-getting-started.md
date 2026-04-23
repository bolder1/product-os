# Getting Started with Product OS

This guide takes you from zero to a running development environment with your first product created.

---

## System Requirements

| Tool | Minimum Version | Recommended |
|------|----------------|-------------|
| Node.js | 22.0.0 | LTS (22.x) |
| pnpm | 10.0.0 | 10.33.0 |
| PostgreSQL | 15 | 16 |
| Git | 2.x | Latest |
| OS | macOS / Linux / Windows (WSL2) | macOS or Ubuntu 22+ |

> **Windows note:** Native Windows is supported. Commands in this guide assume PowerShell or WSL2.

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/product-os.git
cd product-os
```

---

## Step 2: Install pnpm

If you don't have pnpm installed:

```bash
npm install -g pnpm@10.33.0
```

Verify:
```bash
pnpm --version   # should output 10.x
```

---

## Step 3: Install Dependencies

```bash
pnpm install
```

This installs dependencies for all apps and packages in the monorepo simultaneously.

---

## Step 4: Configure Environment Variables

### 4.1 Copy the Example File

```bash
cp .env.example .env.local
```

### 4.2 Set Required Variables

Open `.env.local` and fill in:

```env
# ─────────────────────────────────────────
# Database
# ─────────────────────────────────────────
DATABASE_URL=postgresql://postgres:password@localhost:5432/product_os

# ─────────────────────────────────────────
# Authentication
# ─────────────────────────────────────────
JWT_SECRET=change-me-to-something-long-and-random-at-least-32-chars

# ─────────────────────────────────────────
# AI (Required for OpsPilot + AI skills)
# ─────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-...

# ─────────────────────────────────────────
# App URLs
# ─────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─────────────────────────────────────────
# OAuth (Optional — for social login)
# ─────────────────────────────────────────
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 4.3 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for session tokens (min 32 chars) |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key for Claude models |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of the web app |
| `GITHUB_CLIENT_ID` | ☐ | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | ☐ | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | ☐ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ☐ | Google OAuth client secret |

---

## Step 5: Set Up the Database

### 5.1 Create the Database

```bash
psql -U postgres -c "CREATE DATABASE product_os;"
```

Or with pgAdmin / Postico, create a database named `product_os`.

### 5.2 Run Migrations

```bash
pnpm db:migrate
```

This applies all Drizzle ORM migrations and creates:
- 25+ tables covering organizations, products, graph, tasks, approvals, notifications, and more
- PostgreSQL enums for typed fields
- Indexes for performance

### 5.3 (Optional) Open Database Studio

```bash
pnpm db:studio
```

This opens Drizzle Studio — a visual database browser at [http://local.drizzle.studio](http://local.drizzle.studio).

---

## Step 6: Start the Development Server

```bash
pnpm dev
```

The web application starts at **[http://localhost:3000](http://localhost:3000)**.

To start all services simultaneously (including the Yjs real-time server):

```bash
pnpm dev:all
```

| Service | URL | Purpose |
|---------|-----|---------|
| Web App | http://localhost:3000 | Main Product OS UI |
| Yjs Server | http://localhost:1234 | Real-time collaboration (WebSocket) |

---

## Step 7: Create Your First Account

1. Navigate to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Enter your name, email, and password
3. You'll be redirected to the onboarding flow

---

## Step 8: Onboarding Flow

### Create an Organization

Organizations are the top-level container for teams and products.

1. Enter your organization name (e.g., "Acme Corp")
2. Choose a slug (e.g., `acme` → `localhost:3000/acme`)
3. Select your plan (Free for development)

### Create Your First Product

1. Click **"New Product"**
2. Enter a product name (e.g., "Acme Dashboard")
3. Choose a slug (e.g., `dashboard`)
4. (Optional) Apply a starter template

Your product is now created and you'll land on the **Home dashboard**.

---

## Step 9: Explore the Home Dashboard

The Home dashboard is role-specific. As an Admin, you'll see:
- **Health Score** — overall product graph completeness (0–100)
- **Module Readiness** — per-module breakdown
- **Open Tasks** — your assigned tasks
- **Approval Queue** — pending approvals
- **AI Insights** — OpsPilot recommendations

---

## Development Workflow

### Common Commands

```bash
# Start development
pnpm dev

# Type check all packages
pnpm typecheck

# Lint everything
pnpm lint

# Fix lint issues
pnpm lint:fix

# Build for production
pnpm build

# Run all tests
pnpm test

# Database operations
pnpm db:migrate      # Apply pending migrations
pnpm db:push         # Push schema changes (development only)
pnpm db:studio       # Open visual database browser
```

### Hot Reload

Next.js Fast Refresh is enabled. Changes to any file in `apps/web/app/` will be reflected instantly.

Changes to `packages/api/`, `packages/db/`, or other backend packages require a server restart (`Ctrl+C` and `pnpm dev` again) unless using `pnpm dev:all` which handles this automatically via Turborepo.

---

## Troubleshooting

### ❌ `Module not found` errors

Run:
```bash
pnpm install
pnpm build
```

### ❌ Database connection refused

Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql@16

# Ubuntu / WSL2
sudo service postgresql start

# Check connection
psql $DATABASE_URL -c "SELECT 1;"
```

### ❌ Migrations fail

Check that your `DATABASE_URL` is correct and the database exists:
```bash
psql -U postgres -l | grep product_os
```

If needed, drop and recreate:
```bash
psql -U postgres -c "DROP DATABASE IF EXISTS product_os;"
psql -U postgres -c "CREATE DATABASE product_os;"
pnpm db:migrate
```

### ❌ AI features not working

Verify your Anthropic API key is valid:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-haiku-20241022","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

---

## What's Next?

- [Architecture Overview](02-architecture.md) — understand the system design
- [Studios Guide](05-studios-guide.md) — explore all 27 studios
- [API Reference](04-api-reference.md) — integrate or extend the API
- [Developer Guide](08-development.md) — add features and follow conventions
