# Nevis Clients Dashboard

A dashboard that lets you drill from **company → branch → advisor → channel**, combining a
stacked bar chart with an expandable table over the same twelve months of data (Feb 2024 – Jan
2025). Built as a take-home assignment, then hardened with the kind of production scaffolding
(typed API contract, Docker, CI, a11y automation, rate limiting) a real team would expect around
a feature like this.

## Quick start

**Prerequisites:** Node ≥ 22, pnpm 10 (`corepack enable` will pick up the pinned version from
`packageManager` in `package.json` automatically).

```bash
pnpm install    # also builds packages/shared's dist/ (its `prepare` script), which
                # apps/api and apps/web both need — see Architecture
pnpm dev        # api on :3000, web on :5173 (Vite proxies /api -> :3000)
```

Open `http://localhost:5173`. The API's OpenAPI docs are at `http://localhost:3000/docs`.

> A project-local `.npmrc` pins the public npm registry so installs are reproducible on any
> network; delete it if you prefer your own registry configuration.

**Docker path:**

```bash
docker compose up --build
```

Open `http://localhost:8080` — nginx serves the built web app and reverse-proxies `/api` to the
api container (no CORS needed in this mode; see [Architecture](#architecture)).

## Scripts

Run from the repo root unless noted; they fan out to all workspaces via `pnpm -r`.

| Script               | What it does                                                  |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`            | Starts api (:3000) and web (:5173) in parallel, with reload   |
| `pnpm build`          | Type-checks and builds all three packages                     |
| `pnpm test`           | Runs unit tests (Vitest) in `shared`, `api`, `web`             |
| `pnpm test:coverage`  | Same, with coverage report + thresholds on pure data modules  |
| `pnpm e2e`            | Runs the Playwright suite (`apps/web`) against a real dev stack|
| `pnpm lint`           | ESLint flat config across the whole repo                      |
| `pnpm format:check`   | Prettier check (no writes)                                    |
| `pnpm typecheck`      | `tsc` project builds/checks for all three packages             |

## Architecture

```
apps/api/       Fastify 5 + zod — REST API, OpenAPI docs, ETag caching, rate limiting
apps/web/       Vite + React 19 + Tailwind 4 — chart + expandable table UI
packages/shared/  zod v4 schemas, tree normalizer, MONTHS constant — single source of truth
```

**Zod-single-source-of-truth flow:**

```
packages/shared (zod schema)
        │
        ├── apps/api: validates data/clients.json at startup (fail fast),
        │             validates responses, drives the OpenAPI schema (/docs)
        │
        └── apps/web: re-validates the HTTP response at the runtime boundary
                       (network JSON is not trusted just because the API is)
```

Both apps import the *same* inferred TypeScript types from `packages/shared` — the tree shape is
declared once, not re-typed on each side.

**Request flow:**

- **Dev**: browser → Vite dev server (:5173) → `server.proxy` forwards `/api/*` → Fastify (:3000).
  Same-origin from the browser's perspective; no CORS involved on this path (CORS is still
  configured on the API for direct cross-origin callers).
- **Prod (Docker)**: browser → nginx (:8080) serves the built SPA and reverse-proxies `/api/*` →
  the `api` container on the compose network. Again same-origin, so no CORS is needed in
  production either — it only matters for someone hitting the API directly from another origin.

## Tech choices

| Choice | Why |
| --- | --- |
| **Fastify 5** | Built-in pino logging with request IDs, first-class zod schema validation via `fastify-type-provider-zod`, and `app.inject()` for port-free tests — reads as "knows Node in production" over Express's looser typing and manual wiring. |
| **Recharts 3** | Declarative JSX for stacked bars (`stackId`, rounded top segment), renders real SVG that's assertable in jsdom unit tests, and its `accessibilityLayer` gives keyboard/ARIA support essentially for free. |
| **TanStack Query 5** | Handles loading/error/retry state, caching, and avoids the classic race-condition/unmounted-setState bugs of hand-rolled `useEffect` fetching. |
| **Tailwind CSS 4** | CSS-first `@theme` tokens made it fast to pin down exact design values (colors, radii, spacing) extracted from the Figma screenshots, without a separate design-token build step. |
| **Semantic `<table>` + `<button aria-expanded>`, not ARIA treegrid** | Per the WAI-ARIA APG, a *partial*/incomplete treegrid implementation is worse for assistive tech than no treegrid at all — treegrid requires full roving-tabindex, `aria-level`/`posinset`/`setsize` on every cell, and arrow-key navigation semantics that are easy to get subtly wrong. A real `<table>` with a real `<button>` in the expand cell gets correct Tab order and native Enter/Space handling from the browser, with zero risk of a half-implemented ARIA pattern actively confusing a screen reader. |
| **pnpm workspaces** | Fast, disk-efficient monorepo installs and strict dependency isolation between `apps/*` and `packages/*`, with `workspace:*` protocol keeping `@nevis/shared` always in sync locally. |

## Accessibility

- **Keyboard model**: every expand/collapse control is a real `<button>` — `Tab` moves focus
  through them in document order, `Enter`/`Space` toggle (native button behavior, not custom key
  handling).
- Each toggle button carries `aria-expanded` and an accessible name (e.g. "Expand Branch 1" /
  "Collapse Branch 1"), so the hierarchy's state is announced, not just visually implied by an
  icon rotation.
- The chart has an `sr-only` text summary of what it shows, since the SVG itself is not
  meaningfully readable by a screen reader.
- `apps/web/e2e/dashboard.spec.ts` runs an `axe-core` scan (via `@axe-core/playwright`) in both
  the default and fully-expanded states, asserting zero serious/critical violations — this is
  automated proof, not just a manual claim.
- Chart entrance animation is disabled under `prefers-reduced-motion`.
- A row's depth and sibling position (e.g. "level 2, 2 of 3") are announced via visually-hidden
  (`sr-only`) text inside each row header, chosen deliberately over `aria-level`/`posinset`/`setsize`
  attributes on a non-treegrid table, which ARIA 1.2 only permits on treegrid rows.

## Testing

| Layer | Covers | Run |
| --- | --- | --- |
| Unit (`packages/shared`) | Tree normalizer (non-uniform nesting), month constants, schema edge cases | `pnpm --filter @nevis/shared test` |
| Unit (`apps/api`) | Route contracts against the shared zod schema, ETag/304 caching, CORS, RFC 9457 error shapes, rate limiting, env validation | `pnpm --filter @nevis/api test` |
| Unit (`apps/web`) | `toChartData` mapping, `flattenVisible`/`useExpansion` (expand/collapse incl. keyboard), chart rendering, loading/error states | `pnpm --filter @nevis/web test` |
| E2E (Playwright) | Full journey — load, expand branch, expand advisor, collapse via keyboard; a11y scan; 375px containment (default + fully expanded) | `pnpm e2e` |

80 unit tests (17 shared + 23 api + 40 web) + 3 Playwright e2e specs. Coverage thresholds are enforced on the pure data-mapping
modules (`test:coverage`) rather than on presentational glue.

**Testing notes:** the Playwright config runs on dedicated ports (web `:4311`, api `:4310`)
instead of the default dev ports, so `pnpm e2e` doesn't collide with an already-running
`pnpm dev` on your machine and CI doesn't need special-casing.

## What I'd do next

- Sync the chart to the table's drill-down state instead of always showing company
  totals.
- Virtualize table rows for large trees — the current approach renders every visible row, which
  is fine for this dataset's size but wouldn't scale to thousands of advisors.
- Visual regression testing (Playwright screenshot snapshots) to catch unintentional design
  drift, complementing the functional e2e coverage that exists today.
- i18n and locale-aware number/date formatting (currently `Intl.NumberFormat` hardcodes the `en`
  locale rather than reading it from the browser/user).
- A real datastore and auth instead of a static JSON file served verbatim — the API is already
  shaped so that swapping the data source wouldn't change the route/schema layer.
- Release versioning via changesets, so `@nevis/shared`'s contract changes are tracked and
  consumers can pin/upgrade deliberately.
- Observability: OpenTelemetry tracing/metrics alongside the existing pino structured logs and
  request-id propagation.
