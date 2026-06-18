# AGENTS.md — BaggageCheck Project

## Overview

A zero-dependency static web app for airport check-in staff. No framework, no build pipeline — just HTML, CSS, and vanilla JS served by Netlify.

## Key Files

| File | Purpose |
|---|---|
| `index.html` | Main app page (bag entry, list, limit cards) |
| `settings.html` | Settings page (limits, theme, accent) |
| `style.css` | All styles — CSS custom properties drive theming |
| `app.js` | Main app logic (state, bag CRUD, rendering) |
| `settings.js` | Settings page logic (swatch rendering, save) |
| `netlify.toml` | Netlify config (publish dir = root) |

## State Model

All state lives in `localStorage` under the key `baggagecheck_state` as a JSON object:

```js
{
  checkedLimit: 23,      // kg limit for checked bags
  cabinLimit: 7,         // kg limit for cabin bags
  theme: 'light',        // 'light' | 'dark-grey' | 'amoled'
  accent: '#b80909',     // hex accent colour
  bags: [...],           // array of bag objects
  checkedTotal: 0,       // running kg total for checked bags
  cabinTotal: 0          // running kg total for cabin bags
}
```

Bag object shape:
```js
{ id: Date.now(), number: 1, type: 'checked'|'cabin', weight: 16.0, reading: 16.0 }
```

## Weight Calculation Logic

The app models a **cumulative conveyor-belt scale**: each new reading is the total weight of all bags of that type placed so far. Individual bag weight = current reading − previous running total for that type.

On bag deletion, all bag weights are recalculated from scratch by summing per-type to keep totals consistent.

## Theming System

- CSS custom properties (`--accent`, `--bg`, `--surface`, etc.) live on `:root` and are overridden per `[data-theme]` attribute.
- Accent colour is applied by setting `--accent` and `--accent-dim` inline on `document.documentElement` to allow live preview without a full repaint.
- Three dark modes: `light`, `dark-grey` (charcoal surfaces), `amoled` (true `#000000` background).

## Coding Conventions

- No framework — direct DOM manipulation via `getElementById` and `innerHTML`.
- `loadState()` / `saveState()` are the only entry points to localStorage — never write directly elsewhere.
- `renderBags()` and `renderLimits()` are always called together after any state mutation.
- Toast notifications replace all `alert()` calls for non-blocking UX.
- The top-right button cycles Light → Dark Grey → AMOLED; it is present on both pages.

## Non-obvious Decisions

- **Settings page is a separate HTML file** (not a modal) to keep `app.js` small and allow the settings page to be its own browsing-history entry (back button works naturally).
- **Delete recalculates totals by summing weights** rather than subtracting, to avoid floating-point drift after repeated additions.
- Netlify `publish = "."` serves the repo root directly — no dist folder needed.
