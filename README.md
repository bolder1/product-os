# Product OS

> **Unified Product Intelligence and Execution System**  
> Build, ship, and operate products with AI-powered tooling — from vision to deployment.

---

## What Is Product OS?

Product OS is a full-stack product management platform that unifies product planning, design, development, and operations in a single intelligent workspace. Every entity in your product — features, components, pages, workflows, decisions — lives in a typed **Product Graph** that AI can understand, navigate, and act on.

**Key capabilities:**
- 27 specialized studios (Planner, Features, Design, Code, Handoff, Releases, Testing, and more)
- AI Copilot (OpsPilot) embedded across every studio
- Role-based dashboards for 8 team roles (PM, Designer, Dev, QA, and more)
- Real-time notifications, approval workflows, and control tower health monitoring
- Template gallery for bootstrapping product structures
- Cross-studio deep linking via the Product Graph

---

## Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 22.0.0 |
| pnpm | ≥ 10.0.0 |
| PostgreSQL | ≥ 15 |

### 1. Clone and Install

```bash
git clone https://github.com/your-org/product-os.git
cd product-os
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/product_os

# Auth
JWT_SECRET=your-secret-key-min-32-chars

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

```bash
pnpm db:migrate
```

### 4. Start Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the login screen.

---

## Project Structure

```
product-os/
├── apps/
│   ├── web/                  # Next.js 15 frontend
│   └── yjs-server/           # Real-time collaboration server
├── packages/
│   ├── api/                  # tRPC router definitions
│   ├── ai/                   # AI skill invocation layer
│   ├── auth/                 # Authentication utilities
│   ├── config/               # Shared configuration
│   ├── db/                   # Drizzle ORM schema + client
│   ├── events/               # Event bus + handlers
│   ├── graph/                # Graph traversal utilities
│   ├── templates/            # Template engine
│   └── ui/                   # Shared UI components
├── docs/                     # Full documentation suite
└── package.json              # Monorepo root
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/01-getting-started.md) | Full environment setup + first product |
| [Architecture](docs/02-architecture.md) | System design, layers, and data flow |
| [Database Schema](docs/03-database-schema.md) | All tables, enums, and relationships |
| [API Reference](docs/04-api-reference.md) | tRPC procedures reference |
| [Studios Guide](docs/05-studios-guide.md) | All 27 studios explained |
| [RBAC Guide](docs/06-rbac.md) | Roles, permissions, and access control |
| [AI Features](docs/07-ai-features.md) | OpsPilot, skills, and AI integration |
| [Developer Guide](docs/08-development.md) | Conventions, patterns, and workflows |
| [Deployment](docs/09-deployment.md) | Production deployment guide |
| [Changelog](docs/10-changelog.md) | Version history and release notes |
| [Contributing](docs/CONTRIBUTING.md) | How to contribute |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.5, React 19, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand (client), tRPC (server) |
| Database | PostgreSQL 15+, Drizzle ORM |
| Auth | JWT sessions, OAuth (GitHub/Google) |
| AI | Anthropic Claude (via `@product-os/ai`) |
| Real-time | Yjs (CRDT), WebSocket |
| Monorepo | Turborepo, pnpm workspaces |
| Events | Custom event bus with typed handlers |

---

## License

Proprietary — All rights reserved.  
© 2025 Product OS. See [LICENSE](LICENSE) for details.
