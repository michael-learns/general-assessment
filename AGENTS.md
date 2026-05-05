# AGENTS.md

## Overview

This project is an AI-driven fit assessment app.

The main use case right now is a **payroll fit assessment**:

- a prospect fills out company + scoping details
- an AI interviewer asks follow-up questions in chat
- the app checks product capability through Codealive
- the app generates a structured fit report at the end
- the result is saved in Convex and can optionally trigger a webhook

The codebase is already moving toward a **multi-product assessment platform**, but the active local flow is still centered on the payroll product.

## Stack

- **Framework:** Nuxt 4
- **UI:** Vue 3 + Nuxt UI 4
- **Server runtime:** Nitro (Nuxt server routes)
- **AI SDK:** `@google/genai`
- **Model default:** `gemini-3-flash-preview`
- **Database / backend:** Convex
- **Package manager:** Bun
- **Deployment target:** Vercel
- **E2E tooling:** Playwright
- **Unit testing:** Vitest

## Main Services This App Depends On

### 1. Google Gemini API

Used for the conversational interviewer.

Required env:

- `NUXT_GEMINI_API_KEY`
- `NUXT_GEMINI_MODEL` (optional, defaults in repo)

### 2. Codealive

Used for feature / codebase lookup during the AI interview.

Required env:

- `NUXT_CODE_ALIVE_API_KEY`

Without it, the chat flow will not behave correctly for feature validation.

### 3. Convex

Used to store:

- assessment sessions
- chat messages
- final structured assessments

Required env:

- `NUXT_PUBLIC_CONVEX_URL`

Important:

- `CONVEX_URL` alone is **not enough** for this app
- the Nuxt server routes check `config.public.convexUrl`, which comes from `NUXT_PUBLIC_CONVEX_URL`

### 4. Optional webhook target

Used when an assessment is completed and should notify another internal system.

Optional env:

- `NUXT_ASSESSMENT_WEBHOOK_URL`

## Important Project Areas

### Frontend pages

- `app/pages/assess/[product]/index.vue`
  Registration / start page
- `app/pages/assess/[product]/[sessionId]/scope.vue`
  Scoping form
- `app/pages/assess/[product]/[sessionId].vue`
  AI chat assessment
- `app/pages/report/[product]/[sessionId].vue`
  Final report page

### Server routes

- `server/api/sessions.post.ts`
  Creates a session
- `server/api/sessions/[sessionId]/scope.post.ts`
  Saves scoping data
- `server/api/chat.post.ts`
  Runs Gemini chat + Codealive tool calls
- `server/api/assessment/finalize.post.ts`
  Saves the final assessment
- `server/api/assessment/[sessionId].get.ts`
  Loads report data

### Convex backend

- `convex/schema.ts`
- `convex/sessions.ts`
- `convex/messages.ts`
- `convex/assessments.ts`

## What Must Be Set Up Before The App Can Run

Do these in order.

### 1. Install dependencies

```bash
bun install
```

### 2. Create your `.env`

Start from `.env.example`.

Minimum useful local setup:

```env
NUXT_GEMINI_API_KEY=...
NUXT_GEMINI_MODEL=gemini-3-flash-preview
NUXT_CODE_ALIVE_API_KEY=...
NUXT_PUBLIC_CONVEX_URL=...
```

Optional:

```env
NUXT_ASSESSMENT_WEBHOOK_URL=...
NUXT_PUBLIC_DEMO_BOOKING_URL=...
```

### 3. Set up Convex

If Convex is not initialized for your machine yet:

```bash
bunx convex dev
```

What this does:

- deploys the Convex functions
- generates the real files in `convex/_generated`
- gives you the deployment URL you should place in `NUXT_PUBLIC_CONVEX_URL`

Important:

- the committed `_generated` files are only bootstrap stubs
- run `bunx convex dev` before trusting local builds or deploys

### 4. Make sure local env matches runtime config

This app expects:

- `NUXT_PUBLIC_CONVEX_URL`

If this is missing, the app may:

- create fake `dev_...` sessions
- skip assessment persistence
- fail to load reports later

## How To Run The App

Start the local dev server:

```bash
bun run dev
```

Default local URL:

```text
http://localhost:3000
```

## Normal Manual Assessment Flow

1. Open `http://localhost:3000`
2. Log in or continue as guest
3. Fill out the registration form
4. Complete the scoping form
5. Answer the AI chat questions
6. Click `Generate report` when the assessment draft is ready
7. View the report at `/report/payroll/:sessionId`

## Fastest Way To Run The Assessment

If you do **not** want to manually fill everything out, use the autofill script:

```bash
bun run auto:assessment
```

What it does:

- creates a fresh session through the app API
- submits canned scoping data
- answers the AI chat through `/api/chat`
- detects the final assessment block
- finalizes the report
- prints the report URL

Example output:

```text
Report ready: http://localhost:3000/report/payroll/<sessionId>
```

Useful overrides:

```bash
ASSESSMENT_COMPANY_NAME="My Co" \
ASSESSMENT_INDUSTRY="Retail" \
ASSESSMENT_BASE_URL="http://localhost:3000" \
bun run auto:assessment
```

Supported script env vars:

- `ASSESSMENT_BASE_URL`
- `ASSESSMENT_PRODUCT`
- `ASSESSMENT_COMPANY_NAME`
- `ASSESSMENT_INDUSTRY`
- `ASSESSMENT_ADDRESS`
- `ASSESSMENT_TIN`
- `ASSESSMENT_EMPLOYEES`
- `ASSESSMENT_SIGNATORY`
- `ASSESSMENT_SIGNATORY_POSITION`
- `ASSESSMENT_CONTACT_PERSON`
- `ASSESSMENT_CONTACT_POSITION`
- `ASSESSMENT_CONTACT_PHONE`
- `ASSESSMENT_EMAIL`
- `ASSESSMENT_MAX_TURNS`

## Useful Commands

Run dev server:

```bash
bun run dev
```

Run typecheck:

```bash
bun run typecheck
```

Run unit tests:

```bash
bun run test:run
```

Run e2e tests:

```bash
bun run test:e2e
```

Run autofill assessment:

```bash
bun run auto:assessment
```

## Known Local Caveats

### Existing typecheck issue

At the time of writing, there are pre-existing TypeScript errors in:

- `app/components/HowItWorks.vue`

So `bun run typecheck` may fail even if the assessment flow itself is working.

### Old saved sessions can confuse testing

The app persists session state in local storage.

If local behavior seems wrong after changing env or backend setup:

- restart the dev server
- clear local storage for the app
- start a fresh assessment session

### Reports depend on Convex persistence

If you get:

```text
Report not found. The assessment may still be processing.
```

check first that:

- `NUXT_PUBLIC_CONVEX_URL` is set
- the session is not a fake `dev_...` ID
- Convex is reachable

## If You Need To Debug The Full Flow

Check these parts in order:

1. `server/api/sessions.post.ts`
2. `server/api/sessions/[sessionId]/scope.post.ts`
3. `server/api/chat.post.ts`
4. `server/api/assessment/finalize.post.ts`
5. `server/api/assessment/[sessionId].get.ts`

That order matches the real lifecycle of one assessment.
