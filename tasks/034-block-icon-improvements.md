# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
**Title:** Improve Strategy Block Icons (palette + node headers)

### Goal Statement
**Goal:** Create custom icons for every strategy block, starting with the palette (strategy blocks list), then extend to node headers. Use Gemini to generate icon assets and integrate them with consistent sizing and styling.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18 + Vite, @xyflow/react
- **Language:** TypeScript
- **Database & ORM:** None
- **UI & Styling:** Custom CSS theme (`apps/frontend/src/styles/theme.css`)
- **Authentication:** None
- **Key Architectural Patterns:** Node registry defines metadata for palette + node defaults

### Current State
- Palette icons are single characters from `apps/frontend/src/nodes/nodeRegistry.ts`.
- Node headers in `apps/frontend/src/nodes/*Node.tsx` render letter icons with gradient backgrounds.
- Icons lack meaning and consistency; a mix of letters and emojis.

## 3. Context & Problem Definition

### Problem Statement
Block icons are placeholders (letters/emojis) that do not communicate function, feel inconsistent, and reduce scannability in the palette and node headers. We need a consistent icon system that matches the theme, improves readability at small sizes, and can be maintained as new blocks are added.

### Success Criteria
- [ ] Define Gemini prompt/spec for icon set (style, sizes, color rules, export format).
- [ ] Create custom icons for each strategy block (palette first) using Gemini.
- [ ] Integrate palette icons with consistent sizing and styling without layout regressions.
- [ ] Icon mapping documented per block type and stored in a single registry.
- [ ] Node header icon plan defined for follow-up phase.

---

## 4. Development Mode Context

### Development Mode Context
- **🚨 Project Stage:** Hackathon/prototype
- **Breaking Changes:** Avoid UI regressions; additive CSS/JS changes OK
- **Data Handling:** No data impact
- **User Base:** Demo users and internal testing
- **Priority:** Usability + polish over deep refactors

---

## 5. Technical Requirements

### Functional Requirements
- Palette icons are custom assets per strategy block type.
- Icons are clear at 16-24px and align with existing role color cues.
- System supports adding new block icons with a small, predictable change.

### Non-Functional Requirements
- **Performance:** No noticeable render cost; avoid dynamic icon loading.
- **Security:** No remote icon fetches.
- **Usability:** Icons distinguish blocks with similar labels (e.g., data vs logic).
- **Responsive Design:** Icons remain legible on smaller screens.
- **Theme Support:** Maintain Kraken dark theme; avoid introducing off-palette colors.

### Technical Constraints
- Keep changes local to frontend.
- Avoid heavy icon libraries or non-tree-shaken imports.
- Preserve existing layout spacing and CSS classes where possible.

---

## 6. Data & Database Changes

### Database Schema Changes
None.

### Data Model Updates
- Update `NodeDefinition.icon` to support icon IDs (string) or asset paths.
- Add a single icon registry file that maps block types to icon asset references.

### Data Migration Plan
None.

---

## 7. API & Backend Changes

### Data Access Pattern Rules
None.

### Server Actions
None.

### Database Queries
None.

---

## 8. Frontend Changes

### New Components
- `BlockIcon` (shared icon renderer for palette; reusable for node headers later).

### Page Updates
- Update palette rendering in `apps/frontend/src/canvas/FlowCanvas.tsx`.

### State Management
No state changes required.

---

## 9. Implementation Plan

1) Define Gemini icon spec (style, sizes, color rules, file format, naming).
2) Create icon mapping list for each strategy block type.
3) Generate icons with Gemini and export assets into a project folder.
4) Add icon registry + `BlockIcon` renderer.
5) Replace palette icon rendering to use new assets.
6) Visual QA for palette scan.

---

## 10. Task Completion Tracking

- Update Success Criteria checkboxes in this task as each item is completed.

---

## 11. File Structure & Organization

- Add: `apps/frontend/src/icons/blockIcons.tsx` (icon registry + mapping)
- Add: `apps/frontend/src/components/BlockIcon.tsx`
- Add: `apps/frontend/src/icons/blocks/` (icon assets)
- Update: `apps/frontend/src/nodes/nodeRegistry.ts`
- Update: `apps/frontend/src/canvas/FlowCanvas.tsx`
- Update: `apps/frontend/src/styles/theme.css` (only if needed for icon sizing)

---

## 12. AI Agent Instructions

### Implementation Workflow
🎯 **MANDATORY PROCESS:** Use Context7 for icon library usage; keep icons local and tree-shaken.

### Communication Preferences
Concise updates with file references.

### Code Quality Standards
Typed props, small components, minimal CSS changes.

---

## 13. Second-Order Impact Analysis

### Impact Assessment
- Icon assets could increase bundle size; keep sizes small and compress.
- Asset alignment might drift; verify palette spacing after integration.
- Block meaning might still be unclear; validate icon choices with labels.

---

## Gemini Icon Spec (Palette Phase)

### Target Sizes
- Palette container: 36x36 px (matches `.palette-icon` in `apps/frontend/src/styles/theme.css`).
- Glyph size inside container: ~20-22 px visual weight.
- Export sizes: PNG @1x (36x36) and @2x (72x72) for crispness.

### Style & Color Rules
- Style: clean, geometric, slightly tech-forward; avoid ultra-thin strokes.
- Stroke weight: consistent across all icons; medium thickness for small-size legibility.
- Color: Kraken UI palette only; no new hues. Prefer a single light ink color on transparent background so the CSS container gradient remains visible.
- Background: transparent PNG; no baked background.
- Visual balance: center-weighted; leave 4-6 px padding.

### Naming Convention
- `block-{block-id}.png` and `block-{block-id}@2x.png`
- Example: `block-control.start.png`, `block-control.start@2x.png`

### Block-to-Icon Mapping
- `control.start` — start/play/launch (triangle or rocket-like start cue)
- `control.timeWindow` — clock/time window/shift (clock face + bracket)
- `data.kraken.ticker` — market data/price ticker (line chart or pulse)
- `data.kraken.ohlc` — candles/ohlc bars (candlestick)
- `data.constant` — fixed value/constant (lock or equal sign)
- `data.kraken.spread` — spread/distance (two arrows or bid/ask gap)
- `data.kraken.assetPairs` — pair/link/chain (linked nodes)
- `logic.movingAverage` — smooth/average (wave/curve with dots)
- `logic.if` — decision/branch (split/branch)
- `risk.guard` — guard/protect (shield)
- `action.placeOrder` — confirm/execute (check or lightning)
- `action.cancelOrder` — cancel/undo (x or back arrow)
- `action.logIntent` — log/note (pencil or document)

### Gemini Prompt (Use as-is)
Create a cohesive PNG icon set for a Kraken dark-theme trading UI. 
Constraints: transparent background; single-color light ink that matches Kraken UI (cool light gray/white with slight blue tint); geometric, clean, tech-forward; consistent stroke weight; centered composition; 4-6px padding; optimized for 36x36px containers with ~20-22px glyph size. 
Export each icon as PNG @1x (36x36) and @2x (72x72). 
Do NOT add backgrounds, gradients, or shadows. 
Icons must convey the following meanings:
1) control.start = start/play/launch
2) control.timeWindow = time window (clock + bracket)
3) data.kraken.ticker = market data (line chart)
4) data.kraken.ohlc = candlestick/ohlc
5) data.constant = constant/fixed value (equal/lock)
6) data.kraken.spread = bid/ask spread (two arrows apart)
7) data.kraken.assetPairs = linked pair (chain or linked nodes)
8) logic.movingAverage = moving average (smooth curve + dots)
9) logic.if = decision/branch (split path)
10) risk.guard = protection (shield)
11) action.placeOrder = execute/confirm (check/bolt)
12) action.cancelOrder = cancel (x/undo)
13) action.logIntent = audit/log (document/pencil)
Ensure all icons share identical style and visual weight.

---

## Gemini Prompt v2 (Very Specific, Use This)

You are designing a custom icon set for a dark Kraken-style trading UI.
I need a full set of **individual PNG files**, not a single sheet.

### Output Requirements (non-negotiable)
- **Format:** PNG with **transparent background** (alpha). No checkerboard background, no baked background color, no border, no shadow.
- **Sizes:** Export **two sizes for each icon**: `36x36` (@1x) and `72x72` (@2x).
- **File naming:**
  - `block-control.start.png` and `block-control.start@2x.png`
  - `block-control.timeWindow.png` and `block-control.timeWindow@2x.png`
  - `block-data.kraken.ticker.png` and `block-data.kraken.ticker@2x.png`
  - `block-data.kraken.ohlc.png` and `block-data.kraken.ohlc@2x.png`
  - `block-data.constant.png` and `block-data.constant@2x.png`
  - `block-data.kraken.spread.png` and `block-data.kraken.spread@2x.png`
  - `block-data.kraken.assetPairs.png` and `block-data.kraken.assetPairs@2x.png`
  - `block-logic.movingAverage.png` and `block-logic.movingAverage@2x.png`
  - `block-logic.if.png` and `block-logic.if@2x.png`
  - `block-risk.guard.png` and `block-risk.guard@2x.png`
  - `block-action.placeOrder.png` and `block-action.placeOrder@2x.png`
  - `block-action.cancelOrder.png` and `block-action.cancelOrder@2x.png`
  - `block-action.logIntent.png` and `block-action.logIntent@2x.png`
- **Quantity:** Exactly 13 unique icons. Do not duplicate any.

### Visual Style Requirements
- **Style:** Clean, geometric, tech-forward; minimal but not thin.
- **Stroke weight:** Consistent across all icons. Medium thickness for legibility at 20-22px.
- **Fill:** Use strokes only or a minimal stroke + tiny filled accents; avoid full solid fills.
- **Padding:** Keep 4–6px padding inside the 36x36 canvas. Centered composition.
- **No gradients or shadows.** The UI already adds gradients; icons must be plain.
- **Color:** Single light ink color only (cool light gray/white with a subtle blue tint).
  - Suggested color: `#E6EAF6` or similar.
  - If you need a second color, do **not** use it; stick to one color only.

### Semantics (must be recognizable)
1) `control.start` = start/play/launch (triangle play or “launch” cue)
2) `control.timeWindow` = time window (clock + bracket/underline)
3) `data.kraken.ticker` = market data (line chart with axis)
4) `data.kraken.ohlc` = candles (candlestick bars)
5) `data.constant` = constant/fixed value (equal sign or lock)
6) `data.kraken.spread` = bid/ask spread (two arrows apart or gap)
7) `data.kraken.assetPairs` = asset pairs (linked nodes/chain)
8) `logic.movingAverage` = moving average (smooth curve with dots)
9) `logic.if` = decision/branch (split/branching paths)
10) `risk.guard` = protection (shield)
11) `action.placeOrder` = execute/confirm (check + bolt or strong check)
12) `action.cancelOrder` = cancel/undo (X + back arrow, not refresh)
13) `action.logIntent` = audit/log (document with pencil)

### Consistency Checks
- All icons must look like they belong in the same family.
- No icon should be visually heavier or lighter than the others.
- Avoid overly complex details; icons must read clearly at 36x36.

### Deliverables
- Provide a **zip** of the 26 PNGs (13 icons × 2 sizes), named exactly as above.
