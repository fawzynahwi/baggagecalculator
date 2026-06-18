# BaggageCheck — Airport Baggage Weight Tool

A lightweight, offline-capable web app for airport check-in staff to track passenger baggage weights against allowances in real time.

## Features

- **Two baggage types** — Checked and Cabin, each with its own configurable weight limit
- **Cumulative scale workflow** — Enter the scale reading after each bag; the app automatically subtracts the previous running total to determine the individual bag weight
- **Live progress bars** — Visual indication of how much of each allowance has been used, turning red on over-limit
- **Bag list** — Sequential numbered list showing each bag, its type, and weight
- **Themed UI** — Three display modes (Light, Dark Grey, AMOLED Black) plus a full accent colour system with presets and a custom colour picker
- **Persistent state** — All bags and settings survive page refreshes via `localStorage`

## Tech Stack

- Vanilla HTML, CSS, JavaScript (no build step, no dependencies)
- CSS custom properties for live theming
- `localStorage` for client-side state persistence
- Hosted on Netlify as a static site

## Running Locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server
```

No build step or package installation required.
