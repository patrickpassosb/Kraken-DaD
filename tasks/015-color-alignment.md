# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
**Title:** Align UI accent colors to Kraken palette (#3D2C69)

### Goal Statement
**Goal:** Replace off-brand amber/yellow accents (Run Dry-Run button, warning chips) with the provided Kraken-compatible purple #3D2C69 and harmonized tints.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Vite + React frontend; CSS tokens in `apps/frontend/src/styles`
- **Language:** TypeScript/TSX
- **UI & Styling:** Custom CSS variables (`tokens.css`, `theme.css`)

### Current State
Primary button and warning chips show amber/yellow tints inconsistent with desired Kraken palette.

## 3. Context & Problem Definition

### Problem Statement
Color accents diverge from target palette; need to apply #3D2C69 for primary CTA and warning/notice surfaces.

### Success Criteria
- [ ] Run Dry-Run button uses #3D2C69 palette
- [ ] Warning chips (“Using cached mock data…”) use #3D2C69-tinted surfaces/glow
- [ ] No unintended color regressions elsewhere (other palette entries unchanged)

---

## 4. Development Mode Context

### Development Mode Context
- **🚨 Project Stage:** Demo/hackathon
- **Breaking Changes:** Avoid; visual-only
- **User Base:** Demo users
- **Priority:** Visual consistency

---

## 5. Technical Requirements

### Functional Requirements
- Update color tokens to use #3D2C69 for amber/off-brand accents
- Ensure CTA and warning chip backgrounds/borders derive from new token

### Non-Functional Requirements
- Maintain accessibility/contrast where possible
- Keep changes localized to style tokens

### Technical Constraints
- Use existing token system; no design overhaul

---

## 6. Data & Database Changes

### Database Schema Changes
None

### Data Model Updates
None

### Data Migration Plan
Not applicable

---

## 7. API & Backend Changes

### Data Access Pattern Rules
None

### Server Actions
None

### Database Queries
None

---

## 8. Frontend Changes

### New Components
None

### Page Updates
- Update CSS tokens; verify Run button and warning chips pick up new color

### State Management
Unaffected

---

## 9. Implementation Plan
1) Update color tokens in `tokens.css` to use #3D2C69 and derived tints for former amber and primary accents.
2) Verify btn-primary and warning chips pick up new token values (visual/preview).
3) Quick sanity check (build or UI reload).

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
Mark criteria when tokens updated and visual check done.

---

## 11. File Structure & Organization
- Modify: `apps/frontend/src/styles/tokens.css`
- (No new files)

---

## 12. AI Agent Instructions

### Implementation Workflow
- Minimal token edits; no component churn

### Communication Preferences
- Concise updates with file references

### Code Quality Standards
- Keep CSS variables consistent; prefer rgba derived from hex where needed

---

## 13. Second-Order Impact Analysis

### Impact Assessment
- Color shifts could affect contrast; watch warning text legibility

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
