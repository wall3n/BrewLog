# BrewLog

> A local-first PWA for coffee extraction tracking — log every shot and brew, track beans, build recipes, and analyse your dialling-in history. No account, no server, no cloud.

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

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Language | TypeScript | 6 (strict) |
| Build | Vite + vite-plugin-pwa (Workbox) | 8 |
| Styling | Tailwind CSS + CSS custom properties | 4 |
| Database | Dexie.js (IndexedDB) | 4 |
| Routing | React Router | 7 |
| Charts | Recharts | 3 |
| Icons | lucide-react | latest |
| Fonts | DM Serif Display + DM Mono (self-hosted via fontsource) | — |
| Testing | Vitest + React Testing Library | — |

No backend. No external UI library. All components hand-built from the design spec.

---

## Getting Started

```bash
git clone https://github.com/your-handle/brewlog.git
cd brewlog
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). On first launch the app seeds demo extractions, beans, and recipes so you can explore right away.

```bash
npm run build    # production build → dist/
npm run preview  # preview the built PWA locally
npm run lint     # ESLint
```

### Install as PWA

- **iPhone / iPad**: open in Safari → Share → Add to Home Screen
- **MacOS / Windows / Android**: open in Chrome → install prompt in address bar

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
├── context/        # AppContext — global state via React Context + useReducer
├── db/             # Dexie schema, entity types, seed data
├── utils/          # ratioCalc, scaChart, formatters, methodDefaults
├── styles/         # global.css — CSS custom property design token system
└── router.tsx      # createBrowserRouter — all routes
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
| PWA / offline support | Done |
| Dark / light theme | Done |
| Unit tests | In progress |
| Cloud sync (Supabase) | Planned — v2 |
| Scale integration (Acaia / Felicita via Web Bluetooth) | Planned — v2 |
| Brew timer push notifications | Planned — v2 |
| Public recipe sharing | Planned — v2 |

---

## Deployment

Deployed on **Vercel** as a static PWA. `vercel.json` rewrites all paths to `index.html` so React Router handles client-side navigation.

No environment variables required at v1 — the app is fully local.

When v2 Supabase sync ships:

```bash
cp .env.example .env.local
# fill in:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Contributing

Issues and PRs are welcome. A few ground rules:

- Open an issue before starting significant work — alignment first
- No new external UI libraries — components are built from scratch by design
- Mobile-first: base styles at 375 px, then `sm:` / `md:` / `lg:` breakpoints

---

## License

MIT — see [LICENSE](LICENSE).
