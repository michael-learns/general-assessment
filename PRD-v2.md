# Product Requirements Document
## AI Fit Assessment Platform — v2 (Multi-Product + Integrations)

**Version:** 2.0
**Date:** 2026-06-22
**Status:** Planning
**Supersedes:** PRD.md (v1 — Payroll-only)

---

## Overview

Generalize the AI Payroll Fit Assessment into a **product-agnostic assessment platform** capable of running structured AI-driven fit assessments for any product in the company's portfolio. Each product gets its own assessment config (sections, questions, knowledge source) while sharing a single codebase, deployment, and integration layer.

---

## Problem

The v1 app hardcodes payroll-specific logic throughout:
- `topicMap.ts` — payroll sections and questions
- `systemPrompt.ts` — "payroll consultant" persona, "payroll system codebase" tool descriptions
- `chat.post.ts` — Codealive tool descriptions reference "payroll" explicitly
- `convex/schema.ts` — no `product` field on sessions; `currentSection` defaults to `'Company Overview'`
- Routes — single-product flow with no product context in the URL

Scaling to a second product requires duplicating the entire app or hacking around these constraints.

---

## Solution

A **config-driven assessment engine** where each product is defined by a TypeScript config file. The engine reads the product slug from the URL, loads the corresponding config, and drives the entire assessment — AI persona, sections, Codealive repo, webhook targets — from that config. Zero code changes needed to add a new product.

---

## Goals

1. Add a second product assessment with **no new API routes, no new Convex functions, and no new pages**
2. Support pre-populating client info via URL parameters (for linking from CRM/sales tools)
3. Provide a standardized read API so external apps can pull assessment results
4. Standardize and enrich the outbound webhook payload with product context

---

## Users

| User | Role |
|---|---|
| **Prospective Customer** | Self-service — walks through the assessment |
| **Sales / Pre-Sales Team** | Receives webhook; may also link with pre-filled client info |
| **Developer / Internal Team** | Adds new product configs; consumes the read API |

---

## What's NOT Changing

- Tech stack (Nuxt 4, Nuxt UI, Gemini 2.5 Flash, Codealive, Convex, Vercel)
- Core assessment UX (chat interface, progress panel, fit report, PDF download)
- Authentication/user system
- Dev mode mock sessions

---

## New Features

---

### F1: Assessment Config System

**The single most important change.** All product-specific knowledge lives in config files — the engine touches nothing product-specific.

**Location:** `/lib/assessments/[slug].ts`

**Config schema:**

```ts
export interface AssessmentConfig {
  // Identity
  slug: string                    // URL slug, e.g. "payroll", "hrms"
  productName: string             // Display name, e.g. "Payroll System"
  consultantPersona: string       // AI persona, e.g. "payroll consultant"
  introDescription: string        // Short description shown on the landing page

  // Knowledge source
  codeAliveRepoId: string         // Which Codealive repo to query
  codeAliveSearchDescription: string   // Tool description for codealive_search
  codeAliveConsultantDescription: string // Tool description for codealive_consultant

  // Assessment structure
  sections: AssessmentSection[]   // Ordered list of topic sections

  // Integration
  webhookUrl?: string             // Optional per-product webhook override
                                  // Falls back to NUXT_ASSESSMENT_WEBHOOK_URL env var
}

export interface AssessmentSection {
  name: string
  requiredQuestions: string[]
  codealiveSearchHints: string[]
}
```

**Migration:** Extract the existing payroll logic into `/lib/assessments/payroll.ts` — behavior unchanged for existing payroll assessments.

**Registry:** `/lib/assessments/index.ts` exports a map of `slug → config` and a `getConfig(slug)` helper.

---

### F2: Multi-Product Routing

Restructure all routes to include the product slug.

| Before (v1) | After (v2) |
|---|---|
| `/` | `/` — product picker (if >1 product) or redirect to default |
| `/assessment/[sessionId]` | `/assess/[product]/[sessionId]` |
| `/report/[sessionId]` | `/report/[product]/[sessionId]` |

**Landing page (`/`):**
- If only one product config exists → redirect directly to `/assess/[slug]`
- If multiple → show a simple product picker listing available assessments

**Assessment start page (`/assess/[product]`):**
- Loads config by `product` slug; 404 if not found
- Renders the existing intake form (company name, industry, email)

**Changes to existing pages:**
- `assessment/[sessionId].vue` → `assess/[product]/[sessionId].vue` (passes `product` to all API calls)
- `report/[sessionId].vue` → `report/[product]/[sessionId].vue`

---

### F3: Client Pre-Fill via URL Parameters

Sales team can link directly to a product assessment with client info pre-populated. The intake form fields auto-fill and the user can proceed immediately.

**Supported params:**

| Param | Maps To | Example |
|---|---|---|
| `name` | Contact name (stored on session) | `?name=John+Santos` |
| `email` | Contact email | `?email=john@corp.com` |
| `company` | Company name | `?company=Acme+Corp` |
| `industry` | Industry | `?industry=Manufacturing` |
| `ref` | Source reference (for tracking, stored on session) | `?ref=hubspot-deal-123` |

**Example link:**
```
https://assess.abba.works/assess/payroll?company=Acme+Corp&industry=Manufacturing&email=john@corp.com&ref=hs-123
```

**Behavior:** Pre-filled fields are still editable. `ref` is stored silently — not shown in UI.

**Data model:** Add `contactName`, `sourceRef` fields to Convex `sessions` table (see §Data Model).

---

### F4: Standardized Outbound Webhook

The existing webhook payload is expanded to include product context and client info. Schema is consistent across all products.

**Payload schema (v2):**

```json
{
  "schemaVersion": "2",
  "event": "assessment.completed",
  "timestamp": "2026-06-22T10:00:00Z",
  "product": {
    "slug": "payroll",
    "name": "Payroll System"
  },
  "client": {
    "companyName": "Acme Corp",
    "industry": "Manufacturing",
    "contactName": "John Santos",
    "email": "john@corp.com"
  },
  "session": {
    "id": "<convex session id>",
    "sourceRef": "hs-deal-123",
    "startedAt": "2026-06-22T09:45:00Z",
    "completedAt": "2026-06-22T10:00:00Z"
  },
  "assessment": {
    "id": "<convex assessment id>",
    "overallFitScore": 82,
    "summary": "...",
    "recommendations": "...",
    "sections": [
      {
        "name": "Company Overview",
        "status": "supported",
        "findings": "...",
        "customerRequirements": ["..."]
      }
    ]
  },
  "links": {
    "report": "https://assess.abba.works/report/payroll/<sessionId>"
  }
}
```

**Webhook resolution order:**
1. Per-product `webhookUrl` in config (if set)
2. `NUXT_ASSESSMENT_WEBHOOK_URL` environment variable
3. No webhook sent (silent)

---

### F5: Public Read API

New server-side endpoints for external apps to pull assessment data.

#### `GET /api/public/assessments/[sessionId]`

Returns the full structured assessment result for a completed session.

**Response:**

```json
{
  "product": { "slug": "payroll", "name": "Payroll System" },
  "client": { "companyName": "...", "industry": "...", "email": "..." },
  "session": { "id": "...", "status": "completed", "startedAt": "...", "completedAt": "..." },
  "assessment": {
    "overallFitScore": 82,
    "summary": "...",
    "recommendations": "...",
    "sections": [...]
  }
}
```

**Returns 404** if session not found or assessment not yet completed.
**No auth required for v2** — session IDs are unguessable Convex document IDs (sufficient for internal use).

#### `GET /api/public/assessments/[sessionId]/responses`

Returns the raw conversation transcript for a session.

**Response:**

```json
{
  "sessionId": "...",
  "messages": [
    { "role": "user", "content": "...", "timestamp": 1234567890 },
    { "role": "assistant", "content": "...", "timestamp": 1234567890 }
  ]
}
```

---

## Data Model Changes (Convex)

### `sessions` table — new fields

| Field | Type | Notes |
|---|---|---|
| `product` | `string` | Product slug, e.g. `"payroll"`. Required for all new sessions. |
| `contactName` | `string?` | From pre-fill param `name` |
| `sourceRef` | `string?` | From pre-fill param `ref` |

> **Migration note:** Existing sessions without `product` field are treated as `"payroll"` (backward compatibility via optional field + runtime fallback).

### `assessments` table — new fields

| Field | Type | Notes |
|---|---|---|
| `product` | `string` | Product slug — denormalized for easier querying |

---

## Code Changes Summary

| File / Area | Change |
|---|---|
| `lib/assessments/payroll.ts` | **New** — extract existing topicMap + systemPrompt into config |
| `lib/assessments/index.ts` | **New** — config registry + `getConfig(slug)` helper |
| `lib/systemPrompt.ts` | **Modify** — accept `AssessmentConfig` instead of hardcoded strings |
| `lib/topicMap.ts` | **Delete** — logic absorbed into config files |
| `server/api/chat.post.ts` | **Modify** — accept `product` param; build Codealive tools from config |
| `server/api/sessions.post.ts` | **Modify** — accept `product`, `contactName`, `sourceRef` params |
| `server/api/assessment/finalize.post.ts` | **Modify** — use v2 webhook payload; resolve webhook URL from config |
| `server/api/public/assessments/[sessionId].get.ts` | **New** — read API |
| `server/api/public/assessments/[sessionId]/responses.get.ts` | **New** — transcript API |
| `convex/schema.ts` | **Modify** — add `product`, `contactName`, `sourceRef` to sessions; `product` to assessments |
| `convex/sessions.ts` | **Modify** — create mutation accepts new fields |
| `convex/assessments.ts` | **Modify** — save mutation accepts `product` |
| `app/pages/index.vue` | **Modify** — product picker or redirect logic |
| `app/pages/assess/[product]/index.vue` | **New** — replaces `app/pages/index.vue` intake form |
| `app/pages/assess/[product]/[sessionId].vue` | **New** — replaces `app/pages/assessment/[sessionId].vue` |
| `app/pages/report/[product]/[sessionId].vue` | **New** — replaces `app/pages/report/[sessionId].vue` |
| `app/pages/assessment/[sessionId].vue` | **Redirect** → `/assess/payroll/[sessionId]` (backward compat) |
| `app/pages/report/[sessionId].vue` | **Redirect** → `/report/payroll/[sessionId]` (backward compat) |

---

## Task Breakdown

### Phase 1 — Config System & Engine Refactor (foundation)

- [ ] **T1.1** Define `AssessmentConfig` / `AssessmentSection` TypeScript interfaces in `lib/assessments/types.ts`
- [ ] **T1.2** Create `lib/assessments/payroll.ts` — extract all payroll data from `topicMap.ts` and `systemPrompt.ts`
- [ ] **T1.3** Create `lib/assessments/index.ts` — registry map + `getConfig(slug)` function
- [ ] **T1.4** Refactor `lib/systemPrompt.ts` to accept `AssessmentConfig` — no more hardcoded payroll strings
- [ ] **T1.5** Delete `lib/topicMap.ts` (now fully replaced by config system)
- [ ] **T1.6** Update `server/api/chat.post.ts` to accept `product` param, load config, and build Codealive tool descriptions dynamically

### Phase 2 — Data Model Updates

- [ ] **T2.1** Update `convex/schema.ts` — add `product`, `contactName`, `sourceRef` to `sessions`; add `product` to `assessments`
- [ ] **T2.2** Update `convex/sessions.ts` — `create` mutation accepts new fields; `listByUser` query filters by product optionally
- [ ] **T2.3** Update `convex/assessments.ts` — `save` mutation accepts `product` field
- [ ] **T2.4** Run `bunx convex dev` to regenerate types

### Phase 3 — Server API Updates

- [ ] **T3.1** Update `server/api/sessions.post.ts` — accept and forward `product`, `contactName`, `sourceRef`
- [ ] **T3.2** Update `server/api/assessment/finalize.post.ts` — v2 webhook payload (standardized schema per §F4); webhook URL resolution from config

### Phase 4 — Route Restructure & UI

- [ ] **T4.1** Create `app/pages/assess/[product]/index.vue` — new product-aware intake form with URL param pre-fill
- [ ] **T4.2** Create `app/pages/assess/[product]/[sessionId].vue` — assessment chat page passing `product` to all API calls
- [ ] **T4.3** Create `app/pages/report/[product]/[sessionId].vue` — report page (product-aware)
- [ ] **T4.4** Update `app/pages/index.vue` — product picker (or direct redirect if single product)
- [ ] **T4.5** Add redirect from old routes (`/assessment/[sessionId]` → `/assess/payroll/[sessionId]`, `/report/[sessionId]` → `/report/payroll/[sessionId]`)

### Phase 5 — Integration API

- [ ] **T5.1** Create `server/api/public/assessments/[sessionId].get.ts` — full assessment read endpoint
- [ ] **T5.2** Create `server/api/public/assessments/[sessionId]/responses.get.ts` — transcript read endpoint

### Phase 6 — Validation & Cleanup

- [ ] **T6.1** End-to-end test: complete a payroll assessment — verify report, webhook, and read API all return correct data
- [ ] **T6.2** Add a second product config (e.g. HRMS stub) and verify the engine runs it without any engine-level code changes
- [ ] **T6.3** Test pre-fill URL params on the intake form
- [ ] **T6.4** Update `PRD.md` (v1) to note it is superseded

---

## Environment Variables

No new required env vars. The per-product webhook URL is defined in the config file.

| Variable | Change |
|---|---|
| `NUXT_ASSESSMENT_WEBHOOK_URL` | Now a **fallback** — per-product config can override |
| All others | Unchanged |

---

## Out of Scope (v2)

- Admin dashboard for reviewing all assessments (v3)
- Per-product Codealive API keys (single key covers all repos for now)
- Customer-facing "view my past assessments" portal
- Auth protection on the public read API (v3 — add API key header)

---

## Success Criteria

- [ ] Adding a third product requires **only** creating a new config file in `/lib/assessments/`
- [ ] Existing payroll assessment links and data continue to work after migration
- [ ] External app can pull a complete assessment result via the read API using only the session ID
- [ ] Sales team can generate pre-filled assessment links that load in under 1 second
- [ ] Webhook payload consistently includes product, client, and report link across all products
