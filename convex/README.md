# Convex Backend

This directory contains the Convex database schema and serverless functions.

## Setup

1. Create a free account at https://dashboard.convex.dev
2. Run `bunx convex dev` to deploy and generate types
3. Copy the deployment URL to `NUXT_PUBLIC_CONVEX_URL` in your `.env`

## Tables

- **sessions** — one per customer assessment
- **messages** — full conversation log per session
- **assessments** — structured fit report per session
