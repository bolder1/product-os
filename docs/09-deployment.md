# Deployment Guide

This guide covers deploying Product OS to production.

---

## Overview

Product OS consists of two deployable services:

| Service | Stack | Deployment Target |
|---------|-------|------------------|
| Web App | Next.js 15 | Vercel / Railway / Fly.io |
| Yjs Server | Node.js WebSocket | Railway / Fly.io / DigitalOcean |
| Database | PostgreSQL 15+ | Supabase / Neon / AWS RDS |

---

## Option 1: Vercel + Supabase (Recommended)

This is the simplest production setup with zero infrastructure management.

### Prerequisites

- [Vercel account](https://vercel.com)
- [Supabase account](https://supabase.com)
- Anthropic API key

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name, region closest to your users, and a strong database password
3. Once created, copy the **Connection String** (Settings → Database → Connection string → URI)

The connection string looks like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Step 2: Run Migrations on Supabase

```bash
# Set your production database URL
export DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Run migrations
pnpm db:migrate
```

### Step 3: Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repository
4. Set the **Root Directory** to `apps/web`
5. Set **Framework Preset** to `Next.js`

### Step 4: Configure Environment Variables in Vercel

In the Vercel project settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your Supabase connection string | All |
| `JWT_SECRET` | Random 64-char hex string | All |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | All |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `GITHUB_CLIENT_ID` | Your GitHub app ID | All (if using OAuth) |
| `GITHUB_CLIENT_SECRET` | Your GitHub app secret | All (if using OAuth) |

Generate a secure JWT secret:
```bash
openssl rand -hex 64
```

### Step 5: Deploy Yjs Server (Railway)

The Yjs server requires a persistent WebSocket connection — Vercel serverless functions don't support this.

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the repository, set **Root Directory** to `apps/yjs-server`
3. Add environment variable: `PORT=1234`
4. Copy the Railway public URL (e.g., `wss://yjs-server-xxx.up.railway.app`)
5. Add `NEXT_PUBLIC_YJS_SERVER_URL` to Vercel with this value

### Step 6: Configure OAuth Callbacks (if using OAuth)

In your GitHub OAuth App settings, update the callback URL:
```
https://your-app.vercel.app/api/auth/github/callback
```

---

## Option 2: Self-Hosted (Docker)

For teams that need on-premise or full infrastructure control.

### docker-compose.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: product_os
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/product_os
      JWT_SECRET: ${JWT_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NEXT_PUBLIC_APP_URL: https://your-domain.com
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  yjs-server:
    build:
      context: .
      dockerfile: apps/yjs-server/Dockerfile
    ports:
      - "1234:1234"
    environment:
      PORT: 1234

volumes:
  postgres_data:
```

### apps/web/Dockerfile

```dockerfile
FROM node:22-alpine AS base
RUN npm install -g pnpm@10.33.0

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

### Starting

```bash
cp .env.example .env
# Fill in .env values
docker compose up -d
docker compose exec web pnpm db:migrate
```

---

## Production Checklist

### Security
- [ ] `JWT_SECRET` is at least 64 random characters
- [ ] Database password is strong (≥20 chars, mixed case + numbers + symbols)
- [ ] API keys are stored in environment variables, never in code
- [ ] HTTPS is enforced (Vercel/Railway provide this automatically)
- [ ] `NEXT_PUBLIC_APP_URL` uses `https://`
- [ ] OAuth redirect URIs updated to production URLs

### Database
- [ ] Migrations have been run on the production database
- [ ] Database backups are configured (Supabase automatic, or manual cron for self-hosted)
- [ ] Connection pooling is enabled for high traffic (PgBouncer or Supabase connection pooler)

### Performance
- [ ] Vercel Analytics or similar is configured
- [ ] Error tracking (Sentry) is set up
- [ ] Database queries are indexed (all migrations include appropriate indexes)
- [ ] Next.js Image Optimization is working (check build output)

### AI
- [ ] Anthropic API key has sufficient credits
- [ ] AI fallback behavior has been tested (disconnect AI key temporarily)
- [ ] `ai_skill_history` table is being populated correctly

---

## Environment Variables Quick Reference

| Variable | Required | Dev Default | Production |
|----------|----------|-------------|------------|
| `DATABASE_URL` | ✅ | `postgresql://...localhost/product_os` | Supabase/RDS URL |
| `JWT_SECRET` | ✅ | Any 32+ char string | `openssl rand -hex 64` |
| `ANTHROPIC_API_KEY` | ✅ | Your dev API key | Production API key |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` | `https://app.your-domain.com` |
| `NEXT_PUBLIC_YJS_SERVER_URL` | ☐ | `ws://localhost:1234` | `wss://yjs-server.your-domain.com` |
| `GITHUB_CLIENT_ID` | ☐ | (empty) | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | ☐ | (empty) | GitHub OAuth app secret |
| `GOOGLE_CLIENT_ID` | ☐ | (empty) | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ☐ | (empty) | Google OAuth client secret |
| `SMTP_HOST` | ☐ | (empty) | Resend/SendGrid SMTP |
| `SMTP_API_KEY` | ☐ | (empty) | Email service API key |

---

## Monitoring & Observability

### Application Logs

All structured events are logged to:
- `activity_log` table — all user actions
- `ai_skill_history` table — all AI invocations

Query activity for a specific product:
```sql
SELECT actor_id, action, entity_type, studio_origin, created_at
FROM activity_log
WHERE product_id = 'your-product-id'
ORDER BY created_at DESC
LIMIT 100;
```

### Performance Monitoring

Add to your Next.js configuration (`next.config.js`):
```js
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
}
```

This enables OpenTelemetry for distributed tracing.

### Error Tracking (Sentry)

```bash
pnpm add @sentry/nextjs
```

Follow the [Sentry Next.js setup guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/).

---

## Scaling Considerations

### Database Connection Pooling

At >50 concurrent users, enable connection pooling:

**Supabase:** Enable Supavisor in your project settings (Transaction mode for serverless)

**Self-hosted:** Use PgBouncer:
```yaml
# Add to docker-compose.yml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    DATABASES_HOST: postgres
    DATABASES_PORT: 5432
    DATABASES_DBNAME: product_os
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 500
    DEFAULT_POOL_SIZE: 20
```

Update `DATABASE_URL` to point to PgBouncer instead of PostgreSQL directly.

### Yjs Server Scaling

For >200 concurrent collaborators, deploy multiple Yjs server instances behind a sticky-session load balancer. Yjs requires all clients editing the same document to connect to the same server instance.

---

## Rollback Procedure

### Rolling Back a Deployment

**Vercel:** Go to Deployments → click the previous deployment → Promote to Production

**Docker:**
```bash
docker compose down
git checkout v1.2.3
docker compose up -d
```

### Rolling Back a Database Migration

Database migrations in Product OS are generally forward-only (additive). If you need to roll back:

1. Identify the migration to reverse in `packages/db/drizzle/`
2. Write a manual reverse migration SQL
3. Apply it directly via `psql` or Drizzle Studio
4. Update `__drizzle_migrations` table to reflect the rollback

> **Note:** Never auto-rollback in production — always review the SQL before running.
