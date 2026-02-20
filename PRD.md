# Product Requirements Document
## AI Payroll Fit Assessment

**Version:** 1.0
**Date:** 2026-02-20
**Status:** In Development

---

## Overview

A self-service web application that helps prospective customers determine whether the payroll platform can meet their HR and payroll needs. An AI interviewer guides the customer through a structured but conversational assessment, silently querying the payroll system's codebase in real time to validate feature support. At the end, the customer receives a fit report and the sales team is notified.

---

## Problem

Sales teams spend significant time in discovery calls gathering payroll requirements that could be collected automatically. Prospective customers also lack a way to self-qualify before speaking to sales, leading to mismatched expectations and wasted time on both sides.

---

## Solution

An AI interviewer that:
1. Conducts a structured assessment across 6 topic areas
2. Queries the Codealive-indexed payroll codebase in real time to check feature support
3. Asks intelligent follow-up questions based on customer responses AND system findings
4. Produces a structured fit report for the customer
5. Notifies the sales team with a webhook payload

---

## Users

| User | Role |
|---|---|
| **Prospective Customer** | HR Manager, Payroll Manager, CFO — self-service |
| **Sales / Pre-Sales Team** | Receives webhook notification with assessment results |
| **Implementation Team** | Reviews recommendations section to plan onboarding |

---

## Core Features (v1)

### F1: Conversational AI Assessment
- AI asks questions across 6 structured topic areas
- Required questions per section ensure completeness
- AI asks follow-up questions based on responses
- AI queries Codealive in real time to validate feature support
- Model: Gemini 2.5 Flash with thinking mode

### F2: Assessment Progress Panel
- Sidebar showing all 6 sections
- Visual states: completed ✓, active ●, pending ○
- "Checking feature support..." indicator during Codealive lookups

### F3: Fit Report
- Per-section status: Supported / Partial Support / Gap
- Overall fit score (0–100) calculated deterministically
- Executive summary (2–3 paragraphs)
- Implementation Team recommendations
- Download as PDF (browser print)

### F4: Lead Capture & Team Notification
- Optional email collection at start
- Assessment stored in Convex database
- Webhook POST to team on completion
- `webhookSent` flag tracked in database for retry

---

## Assessment Topic Areas

| # | Section | Key Questions |
|---|---|---|
| 1 | Company Overview | Size, industry, multi-entity, countries |
| 2 | Pay Structure | Frequencies, pay types, overtime, split pay |
| 3 | Leave & Benefits | Leave types, accrual, deductions, allowances |
| 4 | Compliance & Tax | Tax filing, statutory contributions, CBAs |
| 5 | Edge Cases & Special Policies | Proration, final pay, retroactive, off-cycle, multi-currency |
| 6 | Summary | AI generates structured fit report |

---

## Out of Scope (v1)

- Voice/speech interface (v2)
- Admin dashboard for reviewing all assessments (v2)
- CRM integration (webhook covers this for v1)
- Multi-language support

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (SSR + serverless) |
| UI Library | Nuxt UI 4 |
| AI Model | Gemini 2.5 Flash (`gemini-2.5-flash-preview-04-17`) |
| Feature Lookup | Codealive MCP API (`https://mcp.codealive.ai/api`) |
| Database | Convex (managed cloud) |
| Deployment | Vercel (serverless functions) |
| Package Manager | bun |

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NUXT_GEMINI_API_KEY` | Google AI Studio API key | Yes |
| `NUXT_GEMINI_MODEL` | Gemini model ID (default: gemini-2.5-flash-preview-04-17) | No |
| `NUXT_CODE_ALIVE_API_KEY` | Codealive Bearer token | Yes |
| `NUXT_ASSESSMENT_WEBHOOK_URL` | URL to POST results to | No |
| `NUXT_PUBLIC_CONVEX_URL` | Convex deployment URL | Yes |

---

## Deployment

1. Create accounts: [Google AI Studio](https://aistudio.google.com), [Codealive](https://app.codealive.ai), [Convex](https://dashboard.convex.dev)
2. Run `bunx convex dev` to deploy backend and get deployment URL
3. Add environment variables in Vercel project settings
4. Deploy: `npx vercel --prod`

---

## Success Metrics

| Metric | Target |
|---|---|
| Assessment completion rate | > 60% |
| Time to complete | < 15 minutes |
| Sales team value | Surfaces requirements not captured before |

---

## v2 Roadmap

### Voice Interface
- **Option A (easy):** Browser Web Speech API — zero cost, built-in, ~1 day
- **Option B (best accuracy):** Gemini Live API — same model for audio + text, best for HR terminology, ~3 days
- Recommendation: Ship A in v2, upgrade to B in v3

### Admin Dashboard
- View all completed assessments
- Filter by fit score, industry, date
- Re-trigger webhook for failed deliveries

### CRM Integration
- Direct HubSpot / Salesforce connector
- Map assessment fields to CRM deal properties
