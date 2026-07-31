# Change Management Platform — Design Refresh (v2)

> A redesign of [blackmath88/change-management-platform](https://github.com/blackmath88/change-management-platform) — a five-unit interactive workbook that guides practitioners through a full change initiative.

---

## What is this repo?

This repository holds the **design-refresh iteration** of the Change Management Platform. The original platform works well functionally but uses an early-stage visual system. This repo is where the updated design language, component library, and page templates are developed before being merged back.

The platform itself is a browser-based, Supabase-backed workbook that walks a change lead through:

| Unit | Name | Core question |
|------|------|---------------|
| 01 | Shape your change vision | Why does this change need to happen? Where are we going? |
| 02 | Understand the forces | What is pushing — and blocking — the change? |
| 03 | Map your stakeholders | Who matters, how do they stand, what do they need? |
| 04 | Communicate with impact | How do we move people? Know, feel, do? |
| 05 | Nudge & build momentum | What interventions sustain adoption? |

---

## Scope and limitations

This is a **demonstration platform** for IMD's CHM 2026 change management course. It is not intended for production use with sensitive organizational data.

**Authentication model:** The platform uses a client-generated `session_token` stored in browser `localStorage` as the access boundary. Server-side Row-Level Security (RLS) policies enforce that requests can only read or modify rows matching the requesting browser's token. This protects against drive-by access through the public Supabase anon key, but is not a substitute for real authentication.

**What this means in practice:**
- Project data is scoped per browser/profile, not per identified user
- Anyone with access to the same browser session sees the same projects
- Module data (vision, stakeholders, etc.) is cached unencrypted in `localStorage` for offline reads
- Two seeded Swiss policy demo cases are intentionally readable by all visitors (read-only via RLS)

Unit 06 (Coordinate — Acting Without Agreement) is seeded separately via
`seed-unit06-coordinate.sql`. This SQL upserts coordinate-module data for
both demo projects (Einheitskasse and 36-Stunden-Woche), which are both
strong values-based cases where coordination-without-agreement is the
point of the exercise. Safe to re-run to reset the demo state.

**Production deployment** would require migrating to authenticated identity (e.g. Supabase Auth, SSO, or the customer's existing identity provider). This is a deliberate scope choice — the course context does not require account management, and the backend infrastructure will be reshaped when the platform is integrated into a customer environment.

For production-stable accessibility (full keyboard navigation, ARIA roles), see the open accessibility work in the issue tracker.

---

## Current design (v1 baseline)

The original platform ships with:

- **Type** — IBM Plex Sans + Plex Mono + Plex Serif (Google Fonts)
- **Design language** — IBM Carbon-inspired: flat surfaces, hard 2 px radius, border-bottom underline inputs
- **Topbar** — dark (`#121619`), CM logotype, save indicator
- **Sidebar** — 248 px, shows all 5 units as peers, per-unit colour accents
- **Colour system** — grey scale (`--g-00` → `--g-100`), one brand accent (`#0f62fe`), 5 unit accents, semantic ok/warn/danger
- **Layout** — `display: flex` column body → topbar + app-layout → sidebar + unit-main
- **Persistence** — Supabase (postgres) + localStorage write-through cache

### Files

| File | Role |
|------|------|
| `index.html` | Project dashboard (browse, create, import projects) |
| `unit1-vision.html` | Unit 1 workspace |
| `unit2-forces.html` | Unit 2 workspace |
| `unit3-stakeholders.html` | Unit 3 workspace |
| `unit4-communication.html` | Unit 4 workspace |
| `unit5-nudges.html` | Unit 5 workspace |
| `cmt-system.css` | Shared design tokens, topbar, sidebar, layout, components |
| `cmt-client.js` | Supabase API wrapper + localStorage cache |
| `cmt-shell.js` | Shared sidebar renderer (injected into `#sidebar-mount`) |

---

## Design refresh goals (v2)

The refresh targets the following improvements:

### 1 · Visual identity
- Cleaner, more contemporary feel — less "developer tool", more "practitioner workspace"
- Refined type scale: clearer hierarchy between serif headlines, sans body, and mono labels
- Slightly softer surfaces while keeping the editorial restraint

### 2 · Colour system
- Revisit the grey ramp for better perceptual linearity
- Introduce a warmer neutral canvas to reduce eye strain on long sessions
- Keep the 5 per-unit accent colours but refine their light tints for better WCAG contrast
- Ensure all text/background pairings pass AA (4.5:1 for body, 3:1 for large text)

### 3 · Component updates
- **Topbar** — add breadcrumb export action; improve mobile collapse
- **Sidebar** — show per-section completion state (dot → progress arc); collapsible on narrow viewports
- **Cards** — project cards on the dashboard get a clearer meta layout
- **Forms** — move from 1 px underline inputs to a bordered field with cleaner focus ring
- **Buttons** — add a `btn-outline` variant; standardise icon spacing

### 4 · Responsiveness
- Dashboard collapses gracefully below 640 px
- Unit workspace: sidebar becomes a bottom drawer on mobile
- Tab bar scrolls horizontally with fade indicators

### 5 · Accessibility
- All interactive elements are keyboard-navigable with visible focus outlines
- Modals trap focus; `role` and `aria-*` attributes added throughout
- Toast messages use `role="status"` / `aria-live="polite"`

### 6 · Dark mode (stretch)
- CSS custom property overrides via `prefers-color-scheme: dark`
- Keep the same design tokens; swap the ramp values

---

## Design tokens (v2 direction)

The token names remain backward-compatible. Only values change.

```css
:root {
  /* Warm neutral canvas (replaces pure cool grey) */
  --canvas:  #f8f7f5;
  --surface: #ffffff;

  /* Softer grey ramp */
  --g-05: #f5f4f2;
  --g-10: #ececea;
  --g-20: #dddbd8;
  --g-30: #bcb9b5;
  --g-50: #888480;
  --g-70: #4a4744;
  --g-90: #252220;
  --g-100: #131110;

  /* Accent: slightly warmer blue */
  --accent:    #0055fb;
  --accent-hv: #003dc4;
  --accent-lt: #eef3ff;

  /* Typography */
  --sans:  'Inter', system-ui, -apple-system, sans-serif;
  --mono:  'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
  --serif: 'Lora', 'IBM Plex Serif', Georgia, serif;

  /* Radius — slightly more rounded for friendlier feel */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
}
```

> **Note:** Font choices are directional and subject to change. Both Inter and Lora are available via Google Fonts with near-zero layout shift.

---

## Getting started

The platform is entirely static HTML+CSS+JS — no build step required.

```bash
# 1. Clone this repo
git clone https://github.com/blackmath88/change-management-platform-design2.git
cd change-management-platform-design2

# 2. Open index.html in your browser (or serve with any static server)
npx serve .
# → http://localhost:3000
```

> **Backend:** The Supabase project from the original repo is reused during development. No changes to `cmt-client.js` are needed unless the schema changes.

---

## Roadmap

- [x] README — scope and design direction documented
- [ ] Design tokens — update `cmt-system.css` with v2 token values
- [ ] Typography — swap fonts, refine scale
- [ ] Component refresh — topbar, sidebar, cards, forms, buttons
- [ ] Dashboard (`index.html`) — apply updated components
- [ ] Unit pages (`unit1-unit5`) — apply updated components
- [ ] Responsiveness — mobile sidebar drawer, tab bar behaviour
- [ ] Accessibility audit — keyboard nav, ARIA, focus styles
- [ ] Dark mode — `prefers-color-scheme` overrides (stretch)
- [ ] Cross-browser check (Chrome, Firefox, Safari, Edge)

---

## Contributing

1. Work from the `copilot/refresh-repo-design` branch (this PR's branch) or open a new feature branch.
2. Keep changes scoped — one component or one page per PR.
3. Screenshot any visible UI changes and attach them to the PR description.
4. Run the platform locally and navigate through all five units before marking a PR ready for review.

---

## Links

- **Original repo:** https://github.com/blackmath88/change-management-platform
- **Live (original):** deployed via GitHub Pages on the original repo
- **Design reference:** IBM Carbon Design System, Linear.app interface patterns
