# Casework

Casework is a local-first working environment for people moving complex change.
It holds direction, pressure, influence, narrative, experiments, and differences
inside one durable case record.

This repository is being rebuilt from an earlier static prototype. The new
application is independent in identity, language, information architecture, and
visual system. The previous standalone HTML workspaces remain temporarily in the
repository as migration references; they are not included in the production
bundle.

The repository uses pnpm exclusively. The package manager version is declared in
`package.json`; pnpm enforces that declaration through `.npmrc`.

## Product principles

- The case is a composition, not a dashboard.
- Evidence stays beside the judgment it affects.
- Workspaces are available non-linearly.
- Local work is immediate and durable.
- Remote infrastructure remains replaceable.
- AI support produces inspectable context briefs; it does not pretend to decide.
- Quiet ground occupies most of every view.
- Colour appears in relationships, never as decoration.
- Every unusual visual technique must explain something.

## Visual source

The interface is a renderer of the `blackmath88/colors` style lexicon. The first
renderer mapping consumes the intent of:

- `after-wada-doctrine`
- `after-wada-type`
- `seq-stone-ledger`
- `pair-01-dusk-vermillion`
- `mat-matte-washi`

These records are derived *after* Sanzo Wada's relational colour principles; they
are not reproductions of his dictionary plates. The application preserves the
lexicon's rules—relationship, proportion, quiet ground, and one accent per
component—rather than flattening it into a list of hex values.

## Architecture

```text
React + TypeScript + Vite
        │
        ├── typed case domain (Zod)
        ├── feature-oriented workspaces
        ├── repository boundary
        ├── IndexedDB (Dexie)
        └── optional owner-scoped Supabase replica
```

IndexedDB remains the working source on every device. The optional remote adapter
uses a durable local queue, optimistic revisions, and an explicit section-by-section
conflict review; UI components do not address the backend directly.

## Development

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm check
pnpm test
pnpm test:e2e:install # once per checkout
pnpm test:e2e
pnpm build
```

Production output is written to `dist/`. Cloudflare serves that directory with SPA
fallback routing.

The Playwright suite uses a project-local Chromium installation, exercises the
case-to-brief workflow and keyboard dialog behavior, and runs automated WCAG A/AA
checks against the portfolio and case plate. The same checks run in GitHub Actions.

## Current rebuild status

Implemented:

- Durable multi-case domain model with schema validation
- Local IndexedDB repository
- Portfolio and new-case flow
- Native case import/export with validated file envelopes
- Conversion of previous project/module exports into the new case model
- Duplicate, archive/restore, and deliberate-delete case lifecycle
- Optional Supabase authentication and owner-scoped remote replica
- Durable synchronization queue with optimistic revision conflict detection
- Human-readable, workspace-level conflict resolution
- Append-only decision and evidence history
- Deterministic context briefs with Markdown, clipboard, and print output
- Playwright workflow, keyboard, and automated WCAG A/AA coverage
- Optional local material rendering: clear, paper, or fibre
- Horizontally navigable mobile case rail with a persistent return to the index
- Stable case routes
- Asymmetric case overview
- Direction, dynamics, influence, narrative, experiments, and differences
- Debounced local recording with revision state
- Responsive case navigation
- Reduced-motion support
- Wada-derived relational colour and material renderer

Next:

- Revisit product naming and identity after real case use

## Data and privacy

The rebuild is local-first. Without environment configuration, cases remain in the
browser's IndexedDB and are never sent to a remote service.

Authenticated synchronization is optional. To enable it:

1. Create a Supabase project.
2. Apply `supabase/migrations/20260911210000_casework_cases.sql`.
3. Enable email OTP authentication and configure the permitted redirect URLs.
4. Copy `.env.example` to `.env.local` and supply the project URL and anon key.

The anon key is public by design. The migration denies anonymous table access and
uses owner-scoped Row-Level Security for every operation. Never place a service-role
key in this frontend.
