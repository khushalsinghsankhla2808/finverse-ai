# Contributing to FinVerse AI

## Commit Message Format
Every commit must follow this format:
<type>(<scope>): <short description>

Types:
- feat: new feature
- fix: bug fix
- security: security improvement
- perf: performance improvement
- refactor: code restructure without behavior change
- test: adding or fixing tests
- docs: documentation only
- chore: build process, dependencies, tooling
- style: formatting, missing semicolons (no logic change)

Scopes (use the affected area):
- auth, dashboard, transactions, budgets, goals, 
  investments, analytics, ai, reports, settings,
  api, db, middleware, schemas, store, router, ui

Examples:
✅ feat(goals): add monthly pace calculation to goal cards
✅ fix(dashboard): resolve ResponsiveContainer height collapse
✅ security(auth): add exponential backoff to login rate limiter
✅ test(calculations): add unit tests for budget utilization
✅ docs(api): document v1 route versioning in README

❌ "fixed stuff"
❌ "feat: complete Phase 3 backend server, database schemas, 
    and frontend page layouts" (too many changes in one commit)

## Rule: One commit = one logical change
If your commit message needs "and" in it, split it into two commits.
