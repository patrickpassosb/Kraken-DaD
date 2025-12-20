# Task: Kraken Pro UI/UX Alignment

## 1. Task Overview

**Title:** Final Kraken Pro-grade UI pass  
**Goal:** Deliver the final demo-ready Kraken DaD UI with Kraken-native styling, a verified strategy block system (logic + wiring + configuration alignment), a smoother workflow, explicit fee rate display in previews and execution summaries, and a documented expansion shortlist of additional strategy blocks.

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
The canvas and shell need final convergence: header copy must drop “Dry-run only,” the strategy block palette must be categorized and labeled per Kraken references, lanes need clearer Market→Logic→Risk→Execution flow, fees must show both rate (%) and computed value wherever execution is previewed, and the strategy blocks logic/ports must be audited for UI ↔ core alignment.

### Success Criteria
- [ ] Header shows exactly “Kraken DaD” and “Strategy Builder” (no “Dry-run only” in the title) while keeping dry-run status elsewhere.
- [ ] Strategy Blocks panel groups blocks into CONTROL, MARKET, LOGIC & RISK, EXECUTION with distinct but subtle Kraken-native styling; each block shows label and role (Control/Data/Logic/Risk/Action/Audit).
- [ ] Strategy Blocks palette uses a flat list style (no nested card per block) to reduce visual clutter.
- [ ] Orderbook Guard max spread input uses a spinnerless decimal input.
- [ ] Node action toolbar shows on hover (no click/selection required) and uses Kraken-aligned colors for Execute/Disable/Delete.
- [x] Strategy blocks logic is reviewed; key mismatches between UI handles, implied data edges, and strategy-core port definitions are fixed.
- [ ] Add a reusable numeric/value block (constant) to the palette and wire implied data edges for common flows (e.g., limit price or threshold).
- [x] Strategy block inventory is documented with UI ↔ core alignment (block presence, ports, config fields) and functional status (dry-run/validation).
- [x] Each current strategy block is assessed for necessity (keep/remove/merge) with rationale.
- [x] Expansion shortlist of new strategy blocks is proposed with scope notes (data/logic/risk/action) and required backend/API support.
- [x] IF node outputs are labeled true/false (n8n-style) to remove ambiguity.
- [x] Log Intent notes appear in the right-rail audit summary for clarity.
- [ ] Strategy Blocks palette scrollbar matches Kraken UI (custom track/thumb styling, no default OS scrollbar chrome).
- [ ] Strategy Canvas lanes (Market → Logic → Risk → Execution) are visually clear with intentional node placement cues and lane labeling.
- [ ] Order Preview and execution summary surfaces display fee rate (%) and computed fee value from that rate.
- [ ] Kraken Pro dark theme, gradients, and contrast applied consistently; no off-brand accents.
- [ ] Existing dry-run safeguards preserved; no backend schema changes.

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

1) Update shell/header and banners to final copy and Kraken Pro styling; ensure dry-run status moves out of title.  
2) Rebuild Strategy Blocks panel with required categories and role chips; apply Kraken-native styling and a flat list layout.  
3) Clarify canvas lanes (Market/Logic/Risk/Execution) with visuals and node layout cues.  
4) Review strategy blocks wiring/ports; fix mismatches and add the constant block with implied data edges.  
5) Produce strategy block inventory + necessity review + functional audit (UI ↔ core ↔ executor).  
6) Propose additional strategy blocks with API/dependency notes and effort tiers.  
7) Wire fee rate (%) + calculated fee display into Order Preview and any execution summary panels.  
8) Sweep theme polish (including palette scrollbar) for Kraken Pro visuals and verify dry-run safeguards unaffected.

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
