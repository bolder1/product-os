# Product OS Documentation

This directory contains all documentation for the Product OS project.

---

## Documentation Index

### 🚀 Getting Started
| Document | Purpose |
|----------|---------|
| [01 - Getting Started](01-getting-started.md) | Install, configure, and run Product OS for the first time |
| [CONTRIBUTING](CONTRIBUTING.md) | How to contribute to the project |

### 🏗️ Architecture & Design
| Document | Purpose |
|----------|---------|
| [02 - Architecture](02-architecture.md) | System architecture, layers, data flow, design principles |
| [03 - Database Schema](03-database-schema.md) | All tables, columns, enums, and relationships |

### 📖 Reference
| Document | Purpose |
|----------|---------|
| [04 - API Reference](04-api-reference.md) | Full tRPC procedure documentation with input/output types |
| [05 - Studios Guide](05-studios-guide.md) | All 27 studios explained with capabilities and access |
| [06 - RBAC Guide](06-rbac.md) | Roles, permissions, dashboard layouts, utility functions |

### 🤖 Features
| Document | Purpose |
|----------|---------|
| [07 - AI Features](07-ai-features.md) | OpsPilot, AI skills, event-triggered AI, token propagation |

### 🔧 Guides
| Document | Purpose |
|----------|---------|
| [08 - Development Guide](08-development.md) | Patterns, conventions, how to add studios/procedures/handlers |
| [09 - Deployment Guide](09-deployment.md) | Vercel + Supabase, Docker, production checklist |

### 📝 History
| Document | Purpose |
|----------|---------|
| [10 - Changelog](10-changelog.md) | Version history and release notes |

---

## Quick Links

- **Set up locally** → [Getting Started](01-getting-started.md)
- **Understand the system** → [Architecture](02-architecture.md)
- **Add a feature** → [Developer Guide](08-development.md)
- **Deploy to production** → [Deployment Guide](09-deployment.md)
- **API integration** → [API Reference](04-api-reference.md)
- **What changed recently** → [Changelog](10-changelog.md)

---

## Documentation Maintenance

Documentation should be updated whenever:
- A new studio is added
- A new tRPC procedure is added
- The database schema changes
- A new role or permission is added
- A phase is completed

The changelog is updated after every merged PR that adds or changes user-facing behavior.
