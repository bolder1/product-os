# Contributing to Product OS

Thank you for contributing to Product OS! This document explains how to contribute effectively.

---

## Getting Started

1. **Fork and clone** the repository
2. **Install dependencies**: `pnpm install`
3. **Set up your environment** following the [Getting Started guide](01-getting-started.md)
4. **Create a branch** for your work: `git checkout -b feat/my-feature`

---

## Contribution Types

### Bug Reports

Open a GitHub Issue with:
- **Title**: Short description of the bug
- **Steps to reproduce**: Numbered list
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Node version, OS, browser (if UI bug)
- **Screenshots** (if applicable)

### Feature Requests

Open a GitHub Issue with:
- **Title**: Feature name
- **Problem**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other approaches you explored

### Pull Requests

1. Make sure your changes address a single concern
2. Write/update tests for changed behavior
3. Run `pnpm lint:fix` and `pnpm typecheck` before submitting
4. Fill out the PR template completely
5. Link any related issues

---

## Code Standards

### Before Every Commit

```bash
# Type check
pnpm typecheck

# Lint and fix
pnpm lint:fix

# Build
pnpm build
```

All three must pass. The build is the final gatekeeper.

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add notification preferences modal
fix: resolve import path in notifications page
docs: update API reference with setPreferences procedure
refactor: extract notification badge to shared component
perf: add index on activity_log.product_id
chore: upgrade @trpc/server to v11
```

Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`

---

## Pull Request Process

### PR Title Format

```
feat: Phase 36 - Approvals & Decision Workflows
fix: Correct task priority sort order for 'critical' status
docs: Add database schema reference for notification_preferences
```

### PR Description Template

```markdown
## What changed
Brief description of what this PR adds or fixes.

## Why
The problem or need this addresses.

## How to test
1. Start the dev server
2. Navigate to [specific page]
3. Verify [specific behavior]

## Checklist
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes  
- [ ] `pnpm build` passes
- [ ] New/changed behavior has tests or manual verification steps
- [ ] Relevant documentation updated
```

---

## Code Review Guidelines

### As a Reviewer

- Approve if it meets the code standards and solves the stated problem
- Request changes if there are bugs, performance issues, or significant style violations
- Leave suggestions (not blockers) for minor improvements
- Be constructive and specific — explain the "why" behind requests

### As an Author

- Respond to all comments, even if just "acknowledged" or "won't fix (reason)"
- Re-request review after addressing all blocking comments
- Keep PRs small — under 400 lines changed is ideal

---

## Project Structure for Contributors

When contributing, the most relevant files by task type:

### Adding UI to an existing studio
```
apps/web/app/(dashboard)/[orgSlug]/[productSlug]/[studio]/
  page.tsx                  ← studio root page
  _components/              ← studio-specific components
```

### Adding a new API procedure
```
packages/api/src/routers/[domain].ts   ← add procedure here
packages/api/src/root.ts               ← register router (if new file)
```

### Adding a database table
```
packages/db/src/schema/[domain].ts     ← add table definition
packages/db/src/schema/index.ts        ← add export
packages/db/drizzle/                   ← generated migrations
```

### Adding a new event handler
```
packages/events/src/handlers/index.ts  ← add handler function
packages/events/src/setup.ts           ← register subscription
```

---

## License

By contributing to Product OS, you agree that your contributions will be licensed under the project's proprietary license. See [LICENSE](../LICENSE) for details.

---

## Questions?

- Open a Discussion on GitHub for general questions
- Open an Issue for bugs or feature requests  
- Tag `@maintainers` in your PR for urgent review requests
