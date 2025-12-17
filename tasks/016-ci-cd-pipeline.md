# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
**Title:** CI/CD hardening for Kraken-DaD monorepo

### Goal Statement
**Goal:** Design and implement a fast, professional GitHub Actions pipeline for the TypeScript monorepo (frontend, backend, shared packages) that delivers reliable PR validation, main-branch safety, and a manual backend CD hook suitable for hackathon velocity.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Vite + React 18 frontend; Fastify backend; TypeScript 5; Node 18+ runtime
- **Language:** TypeScript/JavaScript (ESM)
- **Database & ORM:** None (stateless)
- **UI & Styling:** Vite React app (dark Kraken theme)
- **Authentication:** None (dry-run only)
- **Key Architectural Patterns:** Monorepo with shared packages (`strategy-core`, `kraken-client`); API in `apps/backend`; frontend in `apps/frontend`; npm workspaces not configured (uses file deps)

### Current State
- Single `ci.yml` workflow only installs/builds backend + frontend with Node 20; no lint/type checks, no caching, no separation by app, no backend deploy hook.

## 3. Context & Problem Definition

### Problem Statement
CI is minimal and serial, lacking lint/type checks, caching, or targeted jobs. There is no safe backend deployment path. Need a clearer, faster pipeline respecting monorepo boundaries and Vercel-managed frontend deploys.

### Success Criteria
- [x] New CI workflow(s) with PR/main/manual triggers, caching, and distinct jobs per app/package.
- [x] Frontend and backend lint/type/build checks run in parallel with shared setup where possible.
- [x] Optional/manual backend CD hook (build + image step scaffold) added but disabled by default.
- [x] Docs/notes explaining pipeline intent and hackathon-fit included in repo.

---

## 4. Development Mode Context
- **🚨 Project Stage:** Hackathon prototype hardening
- **Breaking Changes:** Avoid; keep workflows simple and non-disruptive
- **Data Handling:** No persistence; no credentials in CI
- **User Base:** Contributors and PR reviewers; demo judges need stable main branch
- **Priority:** Fast feedback and clarity over exhaustive coverage

---

## 5. Technical Requirements

### Functional Requirements
- Add PR + push (main) validation workflow with node setup, caching, lint/type/build for frontend/backend/shared.
- Include `workflow_dispatch` for ad-hoc runs.
- Keep frontend deploy handled by Vercel (no deploy action).
- Provide backend CD workflow (manual) that builds backend and optionally builds Docker image (placeholder for Cloud Run/App Runner).

### Non-Functional Requirements
- **Performance:** Use npm caching and matrix/parallel jobs to minimize runtime.
- **Security:** No secret-heavy steps; backend deploy hook gated/manual.
- **Usability:** Clear job names, inline comments, and artifacts/logs easy to read.
- **Responsive Design:** N/A
- **Theme Support:** N/A

### Technical Constraints
- Node 18+; avoid overengineering; keep YAML concise; respect existing package scripts.

---

## 6. Data & Database Changes

### Database Schema Changes
None.

### Data Model Updates
None.

### Data Migration Plan
Not applicable.

---

## 7. API & Backend Changes

### Data Access Pattern Rules
No API code changes expected; only CI/CD config.

### Server Actions
Optional backend image build + placeholder deploy steps.

### Database Queries
None.

---

## 8. Frontend Changes

### New Components
None.

### Page Updates
None.

### State Management
No changes.

---

## 9. Implementation Plan
1) Replace legacy `ci.yml` with modular workflow covering lint/type/build per app/package using caches.
2) Add manual backend CD workflow scaffold (build + docker build/push placeholder) with guard conditions.
3) Document pipeline rationale (short note in README or docs as appropriate).

---

## 10. Task Completion Tracking
Track progress via git commits; mark success criteria in this file when done.

---

## 11. File Structure & Organization
- Update: `.github/workflows/ci.yml`
- Add: `.github/workflows/backend-cd.yml` (or similar)
- Add: docs note (e.g., `docs/ci-cd.md` or README section)
- Update this task file if scope changes.

---

## 12. AI Agent Instructions

### Implementation Workflow
🎯 **MANDATORY PROCESS:**
1. Note Context7 MCP unavailable; proceed with repository knowledge only.
2. Follow task plan, keep YAML minimal with comments for intent.
3. Use npm with caching; avoid try/catch around imports per repo rules.

### Communication Preferences
Concise checklists; cite files in summaries.

### Code Quality Standards
Keep workflows DRY, use `actions/setup-node@v4` with cache, matrix where helpful, clear job names.

---

## 13. Second-Order Impact Analysis
- Watch for job duplication that could slow feedback; ensure manual deploy hook cannot auto-trigger on PRs.
- Ensure caching keyed by lockfiles to avoid stale deps.
- Keep secrets minimal to avoid accidental exposure in a public repo.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details!

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*
*Get the complete toolkit at: https://shipkit.ai*
