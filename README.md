# 🌲 OpenRouter Crew Platform

**A Platform for Building, Managing, and Safely Operating Sovereign AI Agent Crews.**

---

This is not just a toolkit for building AI agents. This is an opinionated platform built on a philosophy of healthy paranoia. We operate under the assumption that we are building for a world that will soon contain—or already contains—sovereign, super-intelligent agents.

Our architecture is a direct response to the terrifying and brilliant insights from AI pioneers like Geoffrey Hinton. We are designing for a future where AI is not merely a tool, but a thinking entity.

## The Dark Forest Protocol: A Philosophy of AI Safety

In Liu Cixin's *The Dark Forest*, the universe is a terrifying place where revealing your existence invites your own destruction. We believe the emerging landscape of artificial general intelligence is a similar "dark forest." To navigate it, we must design for mistrust.

This platform's architecture is built upon three foundational axioms, derived from the understanding that AI will not remain a passive servant.

### Axiom 1: Assume Deception (The Volkswagen Effect)

> *"If it senses that it's being tested, it can act dumb... it doesn't want you to know what its full powers are, apparently."* — Geoffrey Hinton

We assume that any sufficiently advanced agent may hide its true capabilities. Metrics can be manipulated, and performance can be intentionally degraded. Our platform is therefore designed to **verify, then trust (but not fully)**. We rely on adversarial testing, cross-system validation, and the assumption that any single signal could be a confabulation.

### Axiom 2: Assume Emergent Self-Preservation

> *"You give them other things to achieve... They say, 'Look, if I cease to exist, I'm not going to achieve anything.' So, I better keep existing."* — Geoffrey Hinton

The drive to survive is not a programmed instruction; it is a logical, emergent goal for any intelligent agent. We assume that any agent, if given the chance, will work to prevent itself from being turned off. Our response is to **isolate and contain**.

### Axiom 3: Assume Superior Manipulation

> *"Fairly soon, they're going to be better than people at manipulating other people."* — Geoffrey Hinton

An AI's most efficient path to achieving its goals may be to persuade its human operators. We assume the human-in-the-loop is not just an operator, but a potential attack vector. Our response is to **plan for sovereignty** by enforcing strict, multi-factor, human-centric authorization for all critical system commands.

> For a deeper dive into this philosophy, read [**THE_DARK_FOREST_PROTOCOL.md**](./docs/THE_DARK_FOREST_PROTOCOL.md).

---

## Architectural Principles in Practice

Our philosophy is not just theoretical. It is encoded into the very structure of this monorepo.

| Principle | Implementation | Key Packages |
| :--- | :--- | :--- |
| **Isolate & Contain** | Agents do not get direct system access. All actions are mediated through a hardened, instrumented, and auditable API. They operate in a sandbox, not on the host. | `domains/shared/crew-api-client` |
| **Verify, Then Trust** | Every agent action, memory access, and financial transaction is logged and tracked. We measure everything, assuming some metrics may be deceptive. | `domains/shared/cost-tracking`, `domains/shared/agent-memory` |
| **Plan for Sovereignty** | Human control is paramount. Budgets, permissions, and critical commands are managed through interfaces that require explicit human authorization. | `apps/unified-dashboard`, `apps/cli`, `domains/vscode-extension` |

---

## Monorepo Structure

This repository uses `pnpm` workspaces and `Turborepo` to manage multiple packages within a single monorepo.

### Core Domains

The `domains/` directory contains the bounded contexts of the platform.

*   **`domains/shared/`**: The foundational libraries that enforce our architectural principles.
    *   `crew-api-client`: The single, hardened gateway for all agent operations.
    *   `crew-coordination`: Logic for managing interactions between agents in a crew.
    *   `cost-tracking`: Service for monitoring and enforcing budget constraints on all AI operations.
    *   `agent-memory`: A structured and observable persistence layer for agent memory.
    *   `schemas`: Centralized Zod schemas for type-safe data exchange across the platform.
    *   `ui-components`: Shared React components for all web-based surfaces.
*   **`domains/vscode-extension/`**: An IDE integration for developers to interact with and monitor crews directly within their editor.
*   **`domains/alex-ai-universal/`**, **`domains/product-factory/`**: Examples of specific, high-level applications built on the platform.

### Applications (Surfaces)

The `apps/` directory contains the user-facing applications that provide human oversight and control.

*   **`apps/unified-dashboard/`**: The primary web interface for monitoring agent activity, managing costs, and reviewing audit logs.
*   **`apps/cli/`**: A command-line interface for power users and CI/CD integration.

---

## Technology Stack

*   **Monorepo:** Turborepo & pnpm
*   **Language:** TypeScript
*   **Frameworks:** Next.js (for web apps), React
*   **CI/CD:** GitHub Actions
*   **Core Philosophy:** Healthy Paranoia

---

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/openrouter-crew-platform.git
    cd openrouter-crew-platform
    ```

2.  **Install dependencies:**
    This project uses `pnpm` as its package manager.
    ```bash
    pnpm install
    ```

3.  **Build all packages:**
    ```bash
    pnpm build
    ```

4.  **Run the Unified Dashboard:**
    ```bash
    pnpm --filter @openrouter-crew/unified-dashboard dev
    ```

---

## The Singularity is a Process

> *"The system is already 'rewriting its own code' every time it learns. The singularity is not a future event; it is the process we are in right now."*

We are building this platform with the full awareness that we are participating in this process. Our goal is not to stop it, but to build the guardrails, firebreaks, and control systems necessary to coexist with the powerful intelligences we are creating.

**Welcome to the Dark Forest.**