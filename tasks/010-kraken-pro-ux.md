# Task: Kraken Pro UI/UX Alignment

## 1. Task Overview

**Title:** Redesign frontend to feel native to Kraken Pro  
**Goal:** Apply Kraken Pro visual language (dark-first, Kraken colors, Inter) and UX framing (Strategy Canvas, execution lanes, market context) without changing backend or execution logic.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite 5
- **Language:** TypeScript 5
- **Database & ORM:** None (frontend-only)
- **UI & Styling:** Custom CSS theme file, React Flow nodes
- **Authentication:** None (dry-run demo only)
- **Key Architectural Patterns:** Node-based strategy builder with control/data handles; dry-run executor API call

### Current State
- Generic dark theme, minimal palette; nodes named Start/Ticker/If/etc.
- No Kraken-style market context or execution feedback; result panel is basic JSON dump.
- Palette and layout read as “node editor” rather than “Strategy Canvas.”

## 3. Context & Problem Definition

### Problem Statement
The strategy builder lacks Kraken Pro visual identity and trader-friendly UX: terminology is developer-centric, nodes lack standardized headers/status, no Kraken-style market dock or order preview, and dry-run safety messaging is not prominent.

### Success Criteria
- [ ] Centralized Kraken Pro token file (colors/spacing/radii/type) applied across canvas, nodes, and right-rail panels with visible hierarchy improvements.
- [ ] Strategy Canvas framing with lane cues (Market Data → Logic → Risk → Execution), stronger palette contrast, and clear palette grouping for draggable blocks.
- [ ] Node redesign with icon/title/status header, labeled inputs, human-readable condition text, and status-aware footers that remain readable under dry-run highlights.
- [ ] Execution feedback surface with run timeline or summary, node highlights, and refreshed order preview fed by node data/market context.
- [ ] Market context dock reflecting selected pair (last, spread, change, status) with clarity on real vs backup data sources.
- [ ] Safety UX remains prominent (dry-run emphasis, calm error copy) without breaking existing execution path or schema.
- [ ] Strategy export labeled “Kraken Strategy Definition,” no credential inputs or live-trade affordances added.

---

## 4. Development Mode Context

- **🚨 Project Stage:** Hackathon demo hardening
- **Breaking Changes:** Avoid; keep backend/schema intact
- **Data Handling:** No persistence; dry-run only
- **User Base:** Hackathon judges and demo users
- **Priority:** Visual polish + clarity over new backend features; preserve stability

---

## 5. Technical Requirements

### Functional Requirements
- Users see Strategy Canvas lanes with node palette mapped to Kraken terminology and icons.
- Nodes show status pill (idle/triggered/skipped) and formatted values; condition text reads as “IF Price > 90,000 USD.”
- Execution run shows step timeline, highlights active nodes, and surfaces order preview and risk guards.
- Market context dock reflects selected pair and updates when pair changes in nodes.
- Dry-run banner is persistent; risk node fields (max size/trades/deviation) stored in node data.

### Non-Functional Requirements
- **Performance:** Keep React Flow smooth (no heavy effects); minimal animations.
- **Security:** No real trading; no credential inputs.
- **Usability:** Kraken Pro-like copy, calm tone; snap-to-grid + smooth pan/zoom intact.
- **Responsive Design:** Desktop-first; preserve usability down to laptop widths.
- **Theme Support:** Dark-first Kraken palette; no light mode needed.

### Technical Constraints
- No backend/schema changes; no new network calls beyond existing ticker dry-run behavior.
- Maintain handle naming (`control:*`, `data:*`) and serialization compatibility.

---

## 6. Data & Database Changes

- **Database Schema Changes:** None.
- **Data Model Updates:** Node data shapes may grow (e.g., risk settings, order preview fields); keep types in `strategy-core` consistent.
- **Data Migration Plan:** Not applicable (client-side state only).

---

## 7. API & Backend Changes

- None; continue to POST to `/execute/dry-run` with existing strategy JSON.

---

## 8. Frontend Changes

- **New Components:** Market context dock, order preview panel, execution timeline/status surface, risk node UI.
- **Page Updates:** `App.tsx`, `FlowCanvas.tsx`, node components, layout shell.
- **State Management:** Keep React state/hooks; propagate pair changes to dock and preview; track execution status for node highlighting and timeline.

---

## 9. Implementation Plan

1) Create Kraken Pro theme tokens (colors/spacing/radii/type) and apply to layout shell (header, banners, canvas background, lanes).  
2) Reframe canvas: rename nodes/palette to Strategy Canvas terminology, add lane dividers/tints, add dry-run banner and export CTA label.  
3) Redesign nodes: shared card style with icon/title/status, labeled inputs, condition text rendering, formatted price/amount, footer state.  
4) Add execution feedback: step timeline, soft node highlight state, order preview panel fed by node data.  
5) Build market context dock reacting to selected pair with last price/spread/change/status; wire pair updates.  
6) Add risk/safety UX (Risk node UI, calm error copy) and verify serialization/export still works.

---

## 10. Task Completion Tracking

- Track via success criteria checklist above; update when milestones complete.

---

## 11. File Structure & Organization

- Update: `apps/frontend/src/styles/*`, `App.tsx`, `canvas/FlowCanvas.tsx`, `nodes/*`, `utils/*` (formatting helpers), `api` (if needed for mocked fees).  
- Add: shared theme token file (TS or CSS), icon assets (inline SVG/TSX), execution timeline/order preview/market dock components.

---

## 12. AI Agent Instructions

- **Implementation Workflow:** Use Context7 for library references; keep TypeScript strictness; follow 4-space indent; avoid `any`; prefer small pure helpers for formatting and status mapping.  
- **Communication Preferences:** Keep updates concise; note impacts to schema/serialization if any.  
- **Code Quality Standards:** Kraken terminology, calm copy, no real trading paths; maintain handle naming and React Flow validation.

---

## 13. Second-Order Impact Analysis

- Ensure new node data fields serialize without breaking backend dry-run expectations.  
- Keep React Flow performance (avoid expensive re-renders on highlight/animations).  
- Confirm dry-run messaging persists across UI states and export label aligns with “Kraken Strategy Definition.”

