# Domain: Marketing Funnel
**Package:** `@openrouter-crew/marketing-funnel`  
**Layer:** Layer 1 (Domain)  
**Status:** Phase 1 - Consolidated

## 🎯 Purpose & Bounded Context
This domain encapsulates the core business logic for modeling the marketing funnel pattern in relation to OpenRouter's tiered billing structure. It defines the economic and volumetric relationships between different stages of a user's journey and the associated AI model costs.

**Eight-word Purpose:** Model tiered AI billing for marketing funnel.

---

## 🧠 Responsibilities
- Define the stages of the marketing funnel (`Awareness`, `Consideration`, `Decision`, `Action`).
- Map OpenRouter billing tiers (`Haiku`, `Sonnet`, `Opus`) to funnel stages.
- Provide a pure function (`getFunnelData`) to calculate funnel metrics based on live usage.
- Define data structures for funnel metrics (`FunnelMetric`) and live usage (`LiveUsage`).
- Ensure the economic model is stateless and side-effect free.

## 🚫 Explicit Exclusions
- **No UI:** This domain does not contain any React components, 3D rendering logic, or CSS.
- **No Data Fetching:** It does not perform API calls to retrieve live usage data. That is an Application or Script concern.
- **No Persistence:** It does not interact with databases or any storage mechanisms.
- **No Utilities:** Generic helpers (e.g., string formatting) belong in `/packages/utils-*`.

---

## 🛠️ Public API Surface
All exports are unified through the primary `index.ts` barrel file.

### Types
- `FunnelStage`: Enum for marketing funnel stages.
- `BillingTier`: Enum for OpenRouter's AI model tiers.
- `FunnelMetric`: Interface for a single segment of the funnel.
- `LiveUsage`: Interface for current token usage across tiers.

### Functions
- `getFunnelData(usage: LiveUsage): FunnelMetric[]`: Calculates the funnel metrics based on provided live usage data.

---

## 📖 Usage Examples

### In an Application (e.g., `apps/funnel-visualizer`)
```typescript
import { getFunnelData, type LiveUsage } from '@openrouter-crew/marketing-funnel';

const currentUsage: LiveUsage = { haiku: 1000000, sonnet: 400000, opus: 100000 };
const funnelMetrics = getFunnelData(currentUsage);
// Use funnelMetrics to render UI
```

---

## ✅ Definition of Done Compliance
- [ ] Packaged under `@openrouter-crew/` namespace.
- [ ] Exports only through `index.ts`.
- [ ] Zero imports from `/apps` or `/agents`.
- [ ] 95% unit test coverage (Logic integrity).
- [ ] Strictly typed with zero `any` usage.

---

## ⚖️ Architectural Law (Law 3 Compliance)
This package is a **Domain**. Modifications to its core logic require careful consideration as it defines a fundamental economic model for the platform.

**Last Reviewed:** 2026-03-27  
**Lead Architect:** Gemini Code Assist