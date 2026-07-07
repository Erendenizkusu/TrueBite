# TrueBite — _No fake reviews, just the best spots._

TrueBite (internal codename **Volicious**) is a restaurant-discovery app that fixes the
**inflated-ratings problem**. On most platforms a place with 5 reviews at 5.0★ outranks a
beloved spot with 4,500 reviews at 4.6★ — plain arithmetic averages reward thin samples and
manipulation. TrueBite ranks the nearest, most genuinely well-rated restaurants using a
dynamic **Bayesian "RealScore"** that weights each rating by its review volume.

## RealScore

A Bayesian average that blends each venue's raw rating toward the global mean, weighted by
review count. Few-review outliers regress to the mean; established venues keep their signal.
The formula lives in `packages/scoring` so **web, mobile and backend all score identically**.

## Architecture

A **Turborepo** monorepo, **TypeScript end-to-end** — types, schema and business logic
(including the score formula) are written once and shared across every app.

| Path | Stack | Role |
|------|-------|------|
| `apps/api` | **Node.js (TypeScript)** · Supabase SDK | API, caching, Places ingestion |
| `apps/web` | **Next.js** · Tailwind · TanStack Query | SEO/SSR site → organic traffic to app |
| `apps/mobile` | **React Native (Expo)** | Mobile client |
| `packages/scoring` | TypeScript | The RealScore algorithm |
| `packages/core`, `packages/shared` | TypeScript | Config, schema, shared types |
| _db_ | **Supabase (PostgreSQL + PostGIS)** | Geo-radius queries at the DB layer |

Data source: **Google Places API (New)** with aggressive caching for cost control.

## Getting started

**Prerequisites:** Node.js 22+, a Supabase project (or the Supabase CLI for local dev).

```bash
npm install

# Configure each app from its example env file
cp apps/api/.env.example    apps/api/.env
cp apps/web/.env.example    apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env

npm run dev        # Turborepo runs the apps
npm test           # workspace tests
npm run typecheck  # end-to-end type check
```

> Client-side Supabase and Firebase keys are safe to expose by design; access is enforced by
> Row-Level Security / rules, not key secrecy. Never commit a `service_role` key.

## Screenshots

_Coming soon._

## Tech stack

`TypeScript` · `Turborepo` · `React Native (Expo)` · `Next.js` · `Node.js` · `Supabase` · `PostgreSQL + PostGIS` · `Google Places API`
