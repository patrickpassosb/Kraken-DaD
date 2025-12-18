# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
**Title:** Plan CoinGecko-powered asset metadata with Kraken-only filtering and local icons

### Goal Statement
**Goal:** Produce a concrete plan to pull coin metadata/icons from CoinGecko, filter to assets Kraken supports, download/store icons locally, and wire the project to use the local set so every displayed coin has an icon without hotlinking.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18 + Vite frontend; Fastify 5 backend; custom Kraken client package
- **Language:** TypeScript/Node 18+
- **Database & ORM:** None presently (in-memory/data files)
- **UI & Styling:** React with @xyflow/react canvas; basic CSS
- **Authentication:** None
- **Key Architectural Patterns:** Monorepo with apps (frontend/backend) and shared packages; static asset maps in TS

### Current State
- `apps/frontend/src/data/assets.ts` hardcodes coin metadata/icons via CoinGecko hotlinks; many coins lack icons.
- No Kraken-supported asset filter; risk of showing unsupported coins.
- Icons are not stored locally; offline/branding guarantees missing.
- No backend script to reconcile Kraken asset list with CoinGecko IDs or to cache icons.

## 3. Context & Problem Definition

### Problem Statement
We need a reliable asset metadata source with icons that matches Kraken’s supported coins. Hotlinking CoinGecko icons leaves gaps and external dependency risk. A repeatable pipeline should fetch Kraken-supported assets, map them to CoinGecko IDs, download icons locally, and expose consistent metadata to the frontend.

### Success Criteria
- [ ] Document which CoinGecko and Kraken endpoints, params, and rate limits will provide asset metadata and icons.
- [ ] Define a mapping strategy (Kraken asset symbols ⇄ CoinGecko IDs) and data structures/files to store metadata and local icon paths.
- [ ] Specify a repeatable script/process to fetch Kraken assets, resolve CoinGecko IDs, download icons into a repo folder, and fail gracefully on missing icons.
- [ ] Outline frontend/backend integration steps to consume the local metadata/icons and fall back sensibly when an icon is missing.

---

## 4. Development Mode Context

### Development Mode Context
- **🚨 Project Stage:** Hackathon/prototype; rapid iteration acceptable.
- **Breaking Changes:** Avoid user-facing regressions in asset rendering; data reshapes OK with coordination.
- **Data Handling:** No persistent DB; prefer regenerable data files and local assets.
- **User Base:** Internal/demo users.
- **Priority:** Favor correctness and completeness of icon coverage over speed of fetch; keep build size reasonable.

---

## 5. Technical Requirements

### Functional Requirements
- System fetches Kraken-supported asset list (REST) and maps each to a CoinGecko coin ID.
- Script downloads CoinGecko coin logos to a local folder and records paths in a metadata file.
- Frontend reads metadata file and renders local icons; falls back to initials/color when no icon.
- Ability to rerun the pipeline to refresh metadata/icons without manual edits.

### Non-Functional Requirements
- **Performance:** Metadata/icon fetch can be offline/prebuild; runtime UI should load icons instantly from local assets.
- **Security:** No hotlinking; respect CoinGecko TOS/rate limits; avoid leaking API keys.
- **Usability:** Icons should appear wherever coins are shown; fallbacks readable.
- **Responsive Design:** Icons sized for current UI patterns; no layout shift.
- **Theme Support:** Maintain existing color usage; avoid new palette drift.

### Technical Constraints
- Prefer static TS/JSON data under version control; no DB introduction.
- Keep icon sizes small (e.g., 64x64 or svg/png) to limit bundle weight.
- Use Context7 docs for CoinGecko/Kraken API details; do not rely on memory.

---

## 6. Data & Database Changes

### Database Schema Changes
None (file-based metadata).

### Data Model Updates
- Define asset metadata type with symbol, name, krakenId, coinGeckoId, color, iconPath, and fallback initials.
- Store metadata in a shared JSON/TS module (e.g., `apps/frontend/src/data/assets.generated.ts` or `packages/asset-registry/`).

### Data Migration Plan
- Initial generation via script (fetch Kraken assets → resolve CoinGecko IDs → download icons → emit metadata file).
- Regeneration overwrites metadata/icons; ensure deterministic ordering for diffs.

---

## 7. API & Backend Changes

### Data Access Pattern Rules
- Place fetch/reconcile script in backend/tools or a new `scripts/` folder; keep runtime server light.

### Server Actions
- Optional: expose `/assets` endpoint serving metadata (with local icon URLs) if frontend shouldn’t import files directly.

### Database Queries
- None; fetch external APIs (Kraken REST, CoinGecko) during script execution only.

---

## 8. Frontend Changes

### New Components
- Optional: shared `AssetIcon` component that reads local path and renders fallback initials.

### Page Updates
- Update places using `apps/frontend/src/data/assets.ts` to consume the generated metadata and icon paths.

### State Management
- Keep asset registry as importable constant; no runtime fetching needed.

---

## 9. Implementation Plan

1) Research CoinGecko + Kraken endpoints, response shapes, and rate limits for assets/icons.  
2) Design mapping strategy and file layout for metadata and local icons.  
3) Write a script to fetch Kraken assets, map to CoinGecko IDs, download icons, and emit metadata file with paths.  
4) Swap frontend to use generated metadata and local icons with fallbacks.  
5) Verify coverage, broken images, and build size.

---

## 10. Task Completion Tracking

- Track progress via task checklist updates and brief commit notes; mark Success Criteria checkboxes when done.

---

## 11. File Structure & Organization

- New script folder (e.g., `scripts/assets/` or `apps/backend/src/scripts/`), local icon directory (e.g., `apps/frontend/public/icons/coins/`), generated metadata file near existing `assets.ts`, README note for regeneration.

---

## 12. AI Agent Instructions

### Implementation Workflow
🎯 **MANDATORY PROCESS:** Use Context7 for API docs; prefer deterministic scripts; keep ASCII; avoid modifying `ai_task_template_skeleton.md`; avoid hotlinks.

### Communication Preferences
- Be concise, list steps and diffs; surface risks early.

### Code Quality Standards
- Typed TS, small pure functions, graceful error handling, idempotent scripts.

---

## 13. Second-Order Impact Analysis

### Impact Assessment
- Icon bundle size may grow; ensure compression and limited dimensions.  
- Mapping errors could hide supported coins; add logging for unmapped symbols.  
- Build paths must align with Vite asset handling to avoid broken URLs.

---
