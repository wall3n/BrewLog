# BrewLog

A local-first Progressive Web App for coffee extraction tracking. Log every shot and brew, track your beans, build reusable recipes, and analyse your dialling-in history — all on-device, no account required.

---

## Features

- **6-step extraction wizard** — method, bean, equipment, parameters, timer, and tasting notes in one guided flow
- **9 brewing methods** — Espresso, Pour Over, French Press, AeroPress, Moka Pot, Cold Brew, Drip, Siphon, Custom
- **Ratio calculator** — live dose/yield/ratio solver per method with per-method target ranges
- **SCA extraction zones** — EY% zones colour-coded against the Brewing Control Chart standard (ideal 18–22%)
- **Bean library** — track roaster, origin, process, roast level, weight, and days off roast
- **Equipment inventory** — log grinders, machines, and brewers with usage counters
- **Recipe templates** — save and reuse brewing parameters including timed pour stages for filter methods
- **Analytics dashboard** — rating trends, flag breakdown, method distribution, and EY history over time
- **Extraction flags** — mark each brew as Dialled In, Needs Adjustment, or Failure
- **Tasting profile** — score acidity, sweetness, bitterness, body, and balance; attach flavour tags
- **Dark / light / system theme** — persisted per device
- **Export & Import** — full JSON backup and restore from Settings
- **Offline first** — installs as a PWA via Safari or Chrome, fully functional with zero network

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (functional components, strict mode) |
| Language | TypeScript 5 (strict) |
| Build | Vite 5 + vite-plugin-pwa (Workbox) |
| Styling | Tailwind CSS 4 + CSS custom properties design token system |
| Database | Dexie.js 4 — IndexedDB wrapper, all persistence local |
| Routing | React Router 7 |
| Charts | Recharts 3 |
| Icons | lucide-react |
| Fonts | DM Serif Display + DM Mono (self-hosted via fontsource) |
| Testing | Vitest + React Testing Library |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). On first launch the app seeds demo extractions, beans, and recipes so you can explore immediately.

```bash
npm run build    # production build → dist/
npm run preview  # preview the built PWA locally
npm run lint     # ESLint
```

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
├── hooks/          # useDb, useTheme, useTimer
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
| `Bean` | name, roaster, origin, process, roast level, roasted date, status (active/finished/wishlist) |
| `Equipment` | type, name, model, usage count |
| `Recipe` | method, ratio, dose, yield, temp, time, pour stages |
| `AppSettings` | weight/temp/volume units, rating scale, default method, theme |

All data lives in IndexedDB via Dexie. Nothing is sent to any server.

---

## Deployment

Deployed on **Vercel** as a static PWA. The `vercel.json` rewrites all paths to `index.html` so React Router handles client-side navigation correctly.

**No environment variables are required at v1.** The app is fully local.

When v2 Supabase cloud sync is added:

```bash
cp .env.example .env.local
# then fill in:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Roadmap

**v2 (planned)**
- Supabase cloud sync with offline-first conflict resolution
- Web Bluetooth integration for Acaia and Felicita scales
- Push notifications for brew timer
- Share recipes as public links

---

## License

Private. All rights reserved.
