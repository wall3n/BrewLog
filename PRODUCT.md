# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One home barista (the owner) at v1. The main scene is a phone next to the espresso machine or the pour-over station: one hand is busy, a shot or a brew is running, and the log must be fast. Review of history and analytics also happens mostly on the phone. Desktop use exists but is secondary.

Future versions will connect users with other people (sharing or social features). This is not in scope now and the data model must not assume it.

## Product Purpose

BrewLog records each coffee extraction (espresso, pour over, French press, AeroPress, moka pot, cold brew, drip, siphon, custom) with its bean, equipment, parameters, time, and tasting result. The goal is to dial in faster: see what changed between shots and which settings gave the best cup.

Success: a shot is logged in seconds at the machine, and the history clearly shows the path to a dialled-in recipe.

## Positioning

Local-first and private. No account, no server, no cloud. All data stays on the device in IndexedDB, and the app works fully offline as an installed PWA. It uses real extraction science (ratio solver, EY/TDS, SCA brewing control chart) instead of a generic notes app.

## Operating Context

- Used at the brew station: scale, grinder, machine or brewer, timer, sometimes a refractometer.
- Installed on iPhone via Safari "Add to Home Screen". Standalone display, safe areas, bottom tab bar.
- Rituals: dialling in a new bag (several shots in a row, small grind changes), daily brew, reviewing a bean's history.

## Capabilities and Constraints

- Screens: Home, 6-step log wizard (method → bean → equipment → parameters → timer → tasting), History and extraction detail, Recipes (with timed pour stages), Beans, Equipment, Analytics, Settings (theme, language, export/import JSON), first-run welcome and quick setup.
- Extraction flags: Dialled In, Needs Adjustment, Failure.
- Tasting: acidity, sweetness, bitterness, body, balance, flavour tags, rating.
- Stack and rules fixed by `CLAUDE.md`: React 19, Vite, TypeScript strict, Tailwind 4 for layout only, CSS custom properties for all colours, CSS Modules per component, Dexie only, lucide-react icons only, recharts only, no external UI libraries, no inline styles except runtime-computed values, i18n for every string (en, es, fr).
- Fonts are self-hosted (fontsource). No runtime network fetches.
- Light, dark, and system themes are required.

## Brand Commitments

- Name: BrewLog.
- Tone requested by the owner: specialty coffee identity, sober and clean, with the best usability.

## Evidence on Hand

- Demo seed data in `src/db/seed.ts` (synthetic).
- No real users, testimonials, or metrics. Do not invent any.

## Product Principles

1. Logging at the machine comes first. Every tap and every field must earn its place.
2. Numbers are the product. Dose, yield, ratio, time, and temperature must read at a glance.
3. Private by design. Nothing leaves the device.
4. Guide, do not lecture. Show target ranges and the next adjustment, not theory.

## Accessibility & Inclusion

Large touch targets for use with wet or busy hands. Contrast must hold in bright kitchen light and in dim morning light.
