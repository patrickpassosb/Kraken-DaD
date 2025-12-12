Below is the **updated, clean, authoritative context document**, rewritten from scratch to **replace the previous one**, fully incorporating **all new decisions and clarifications** we made together.

You can paste this **as-is** into **Google Antigravity** (or any agent).
This is now the **single source of truth** for the project.

---

# Kraken DAD — Updated Context for AI Agent

**Kraken Drag-and-Drop Strategy Builder**

---

## 1. Project Identity

**Project Name:** Kraken DAD
**Meaning:** Kraken Drag-and-Drop Strategy Builder
**Hackathon:** Kraken Forge – Build the tools beneath the surface
**Track:** Track #3 — Strategy Builder
**Primary Objective:**
Build a **foundational, extensible drag-and-drop strategy builder** that allows users to visually assemble trading strategies using **reusable blocks**, fully integrated with **Kraken’s API**, and visually aligned with **Kraken Pro**.

This project prioritizes **architecture, correctness, extensibility, and engineering quality** over feature quantity.

---

## 2. Non-Negotiable Constraints

The solution **must**:

1. Use **React** for the frontend
2. Use **Node.js** for the backend runtime
3. Use **TypeScript** on **both frontend and backend**
4. Integrate **directly with Kraken’s API**
5. Implement a **drag-and-drop strategy composition system**
6. Be visually inspired by **Kraken Pro**
7. Stay entirely within **Kraken’s ecosystem**
8. Be **open source** under the **MIT License**
9. Be submitted as:

   * GitHub repository
   * Working prototype
   * Demo video
   * Clear README with architecture explanation

---

## 3. Product Vision

Kraken DAD is a **low-code, professional-grade strategy builder** for Kraken traders.

It allows users to:

* Visually compose strategies using **drag-and-drop blocks**
* Define **conditional logic and execution flows**
* Convert a visual graph into an **executable strategy model**
* Safely execute or simulate strategies using Kraken APIs

Think of this as:

> **Node-RED / n8n–style visual programming**, but purpose-built for **Kraken trading workflows**.

---

## 4. Architecture Philosophy

Kraken DAD is designed as a **real system**, not a mock UI.

### Core architectural principles:

* Clear separation of concerns
* Kraken-first design (not exchange-agnostic)
* Event-driven execution
* Extensible block system
* Safe execution (paper trading / dry-run by default)

---

## 5. Repository Structure (Monorepo)

A **single monorepo** is used for organization and clarity.
Each application is **deployed independently**.

```
kraken-dad/
├── apps/
│   ├── frontend/        # React + TypeScript UI
│   └── backend/         # Node.js + Fastify API
├── packages/
│   ├── strategy-core/   # Shared strategy schema & execution logic
│   └── kraken-client/   # Kraken API wrapper (REST + WS)
├── README.md
└── package.json
```

The monorepo **does not imply a single deployment**.

---

## 6. Frontend (Strategy Builder UI)

### Tech Stack

* **React**
* **TypeScript**
* **react-flow** (strategy canvas)
* **Zustand** (state management)
* **Tailwind CSS** (dark theme)
* Kraken Pro–inspired UI design

### Responsibilities

* Drag-and-drop strategy composition
* Visual block configuration
* Strategy validation (UI-level)
* Serialization of strategy graph to JSON
* Sending strategies to the backend

### UX Requirements

* Dark, professional trading UI
* Dense layout similar to Kraken Pro
* No playful or consumer-style visuals
* Clear execution flow visualization

Reference UI:
[https://pro.kraken.com/app/trade/btc-usd](https://pro.kraken.com/app/trade/btc-usd)

---

## 7. Backend (Execution & Integration Layer)

### Backend Tech Stack

* **Node.js** (runtime)
* **TypeScript** (language)
* **Fastify** (web framework)
* **Zod** (schema validation)
* **Pino** (logging)

### Why Fastify

Fastify is chosen because it aligns with Kraken’s engineering culture:

* High performance
* Low latency
* Strong TypeScript support
* Built-in schema validation
* Common in fintech and real-time systems

---

### Backend Responsibilities

The backend is responsible for:

1. **Kraken API Integration**

   * Secure API key handling
   * REST requests
   * WebSocket connections
   * Market data streaming

2. **Strategy Execution Engine**

   * Parse strategy JSON
   * Convert blocks into executable steps
   * Handle conditions, timing, and order logic
   * Enforce execution safety

3. **Security & Isolation**

   * Never expose API keys to frontend
   * Enforce rate limits
   * Validate all strategies server-side

4. **Execution Modes**

   * Default: **paper trading / dry-run**
   * Real execution optional but clearly marked

---

## 8. Strategy Model

Strategies are represented as a **JSON-based directed graph**:

* Nodes = blocks (data, logic, actions)
* Edges = execution flow
* Fully serializable
* Versionable
* Executable by the backend

This model is shared between frontend and backend via `strategy-core`.

---

## 9. Deployment Strategy

### Frontend Deployment

* **Platform:** Vercel
* **Root directory:** `apps/frontend`
* Independent deployment

### Backend Deployment

* **Platform:** Google Cloud Run
* **Runtime:** Dockerized Node.js app
* **Root directory:** `apps/backend`
* Uses GCP Secret Manager for API keys

Frontend and backend are deployed **separately**, despite living in the same repo.

---

## 10. Kraken API Usage Policy

The project must:

* Use Kraken APIs meaningfully
* Avoid fake or mock-only data
* Clearly show real integration points
* Respect Kraken rate limits
* Stay within Kraken’s ecosystem

This is a **Kraken-native tool**, not a generic trading app.

---

## 11. Evaluation Alignment

This project is optimized for Kraken Forge judging criteria:

* **Innovation:** Visual strategy composition
* **Technical Execution:** Clean, extensible architecture
* **Reusability:** Modular block system
* **UX:** Professional, trader-focused UI
* **Documentation:** Clear explanation of design decisions
* **Presentation:** Concise, engineering-focused demo

---

## 12. Core Message to the Agent

> You are building the **foundational architecture** of a professional, Kraken-native, drag-and-drop trading strategy builder.
>
> Prioritize **clean systems, extensibility, correctness, and clarity** over feature volume.
>
> Think like a Kraken engineer, not a hobbyist.

---

If you want, next I can:

* Generate the **strategy JSON schema**
* Define the **block taxonomy**
* Create a **Fastify backend skeleton**
* Design the **execution lifecycle**
* Write a **judge-optimized README**

Just tell me the next step.
