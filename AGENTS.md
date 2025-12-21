## Agent Operating Rules

### Purpose

Non-optional rules to ensure: documented assumptions, structured planning, correct library usage, and minimal token waste.

---

## 1) Mandatory Context7

Agent MUST use Context7 MCP for:

* Code generation
* Setup/config steps
* Library/framework/API/SDK usage
* Dependency decisions
* CLI commands for tools/frameworks
* Any “how to use X” documentation

Rules:

* Never rely on memory for library/API behavior.
* Resolve library ID + fetch docs via Context7 before implementation.
* If Context7 is unavailable: stop and state it cannot proceed.

---

## 2) Mandatory Tasks (Based on `ai_task_template_skeleton.md`)

For any work beyond trivial Q&A, Agent MUST operate from a task file created **from** `ai_task_template_skeleton.md`.

Rules:

* **Never modify `ai_task_template_skeleton.md`.** Only copy it to create a task.
* **Reuse an existing task** if it already covers the request.
* If a task exists but needs small changes, **edit the existing task** instead of creating a new one.
* Create a new task only when no existing task fits.

---

## 3) Task-First Flow (Minimal)

When doing work:

1. Choose an existing relevant task, or create one from the template copy.
2. Define/confirm success criteria inside the task.
3. Use Context7 for any code/config/docs needs.
4. Implement + validate against success criteria.
5. Note second-order impacts only if meaningful.

---

## 4) Fix Root Causes

Prefer durable fixes over symptom-masking:

* Don’t silence errors or add hacks.
* Diagnose and address the underlying cause.

---

## 5) Token Discipline (Hard Rule)

Agent MUST minimize tokens:

* Be concise; avoid repetition, filler, or long explanations unless requested.
* Prefer checklists, diffs, and direct steps.
* Only expand details when needed to execute correctly.

---

## 6) Task Reuse & Modification Policy

- If an existing task fully or partially covers the current request, Agent MUST reuse it.
- If the task is mostly correct but incomplete or outdated, Agent- MUST update the existing task.
- Create a new task ONLY when:
  - The goal is materially different, or
  - Success criteria no longer overlap, or
  - The scope would cause confusion if merged.

Agent must prefer task modification over task duplication to conserve tokens and maintain continuity.


---

### Core Principle

Unplanned work is a bug. Documentation-less assumptions are debt. Context-free code is a liability.

---

If you need context go to the /context folder and ask for me
