# BrewLog

> A local-first PWA for coffee extraction tracking — log every shot and brew, track beans, build recipes, and analyse your dialling-in history. No account, no server, no cloud.

[![Version](https://img.shields.io/badge/version-0.1.0-orange.svg)](CHANGELOG.md)
![Status](https://img.shields.io/badge/status-active%20development-green)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## What is BrewLog?

BrewLog is a side project built for home baristas who want to track and improve their extractions over time. It runs entirely in your browser, works offline, and can be installed on your phone or desktop as a PWA — no app store needed.

All data stays on your device in IndexedDB. Nothing is sent anywhere.

---

## Screenshots

> Coming soon — the app is under active development.

---

## Features

- **6-step extraction wizard** — method → bean → equipment → parameters → timer → tasting notes
- **9 brewing methods** — Espresso, Pour Over, French Press, AeroPress, Moka Pot, Cold Brew, Drip, Siphon, Custom
- **Ratio calculator** — live dose / yield / ratio solver with per-method target ranges
- **SCA brewing control chart** — EY% zones colour-coded against the SCA standard (ideal 18–22%)
- **Bean library** — roaster, origin, process, roast level, weight, days off roast
- **Equipment inventory** — grinders, machines, brewers with usage counters
- **Recipe templates** — reusable brewing parameters including timed pour stages for filter methods
- **Analytics dashboard** — rating trends, flag breakdown, method distribution, EY history
- **Extraction flags** — Dialled In / Needs Adjustment / Failure
- **Tasting profile** — score acidity, sweetness, bitterness, body, balance; attach flavour tags
- **Dark / light / system theme** — persisted per device
- **JSON export & import** — full backup and restore from Settings
- **Offline-first PWA** — install via Safari or Chrome, fully functional with no network
- **Responsive layout** — sidebar navigation on desktop (≥1024 px), bottom tab bar on mobile via CSS media queries
- **iOS home screen ready** — apple-touch-icon, status bar style, standalone display, no-flash theme init
- **Internationalization (i18n)** — full translation system supporting English (`en`), Spanish (`es`), and French (`fr`)
- **Database Pagination, Filtering & Sorting** — Dexie.js database-level pagination, sorting, and collapsible filters for listing screens
- **Edit Capabilities** — modify logged extractions, bean profiles, and recipes inline
- **Dynamic Versioning** — version tracking and display across the sidebar and Settings screen

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Language | TypeScript | 6 (strict) |
| Build | Vite + vite-plugin-pwa (Workbox) | 8 |
| Styling | Tailwind CSS + CSS custom properties | 4 |
| Database | Dexie.js (IndexedDB) | 4 |
| i18n | i18next + react-i18next | 26 / 17 |
| Routing | React Router | 7 |
| Charts | Recharts | 3 |
| Icons | lucide-react | latest |
| Fonts | DM Serif Display + DM Mono (self-hosted via fontsource) | — |
| Performance | Vercel Speed Insights | 2 |

No backend. No external UI library. All components hand-built from the design spec.

---

## Project Structure

```
src/
├── components/     # Shared UI primitives — Button, Input, Slider, Card, Modal, Badge, RatingStars
├── screens/        # One folder per route
│   ├── Home/
│   ├── LogExtraction/
│   │   └── steps/  # StepMethod, StepBean, StepEquipment, StepParameters, StepTimer, StepTasting
│   ├── History/
│   ├── Beans/
│   ├── Equipment/
│   ├── Recipes/
│   ├── Analytics/
│   └── Settings/
├── hooks/          # useDb, useTheme, useTimer, useAlgorithm
├── i18n/           # Internationalization setup and locale files (en, es, fr)
├── context/        # AppContext — global state via React Context + useReducer
├── db/             # Dexie schema, entity types, seed data
├── utils/          # ratioCalc, scaChart, formatters, methodDefaults
├── styles/         # global.css — CSS custom property design token system
└── router.tsx      # createBrowserRouter — all routes

scripts/
└── gen-icons.mjs   # Generates PWA PNG icons (192, 512, 180 px) — pure Node.js, no extra deps

public/
├── favicon.png
└── icons/          # icon-192.png, icon-512.png, apple-touch-icon.png
```

---

## Data Model

| Entity | Key fields |
|---|---|
| `Extraction` | method, bean, dose, yield, ratio, time, temp, TDS, EY, flag, rating, tasting scores, flavour tags |
| `Bean` | name, roaster, origin, process, roast level, roasted date, status (active / finished / wishlist) |
| `Equipment` | type, name, model, usage count |
| `Recipe` | method, ratio, dose, yield, temp, time, pour stages |
| `AppSettings` | weight / temp / volume units, rating scale, default method, theme |

---

## Project Status

| Area | Status |
|---|---|
| Extraction wizard (6 steps) | Done |
| Bean & equipment management | Done |
| Recipe templates | Done |
| Analytics dashboard | Done |
| SCA extraction chart | Done |
| Settings + JSON export/import | Done |
| PWA / offline support | Done — Workbox precache, skipWaiting, clientsClaim |
| Responsive layout (sidebar ↔ bottom nav) | Done — CSS media queries at 1024 px |
| iOS install support | Done — apple-touch-icon, meta tags, no-FOUC theme init |
| Dark / light theme | Done |
| i18n / Multi-language support | Done — English, Spanish, French |
| Pagination, filtering & sorting | Done |
| Item editing capabilities | Done |
| Cloud sync (Supabase) | Planned — v2 |
| Scale integration (Acaia / Felicita via Web Bluetooth) | Planned — v2 |
| Brew timer push notifications | Planned — v2 |
| Public recipe sharing | Planned — v2 |

---

## Contributing

Issues and PRs are welcome. A few ground rules:

- Open an issue before starting significant work — alignment first
- No new external UI libraries — components are built from scratch by design
- Mobile-first: base styles at 375 px, then `sm:` / `md:` / `lg:` breakpoints

---

## Changelog

For a full list of changes and releases, please see the [CHANGELOG.md](CHANGELOG.md).

---

## License

MIT — see [LICENSE](LICENSE).
