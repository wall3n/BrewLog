# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-17

### Added
- **History Grouped Ledger**: Redesigned history list as a grouped ledger layout for better readability and date-based organization.
- **Search & Filter Debounce**: Added debounce to all search inputs and filter controls across list screens to reduce rendering congestion.

### Fixed
- **Touch Device Hover States**: Disabled hover effects on touch devices to prevent sticky hover states on mobile.
- **Modal Centering on Mobile**: Centered modal dialogs on mobile instead of bottom-sheet positioning for consistent cross-device UX.
- **Missing Translation Keys**: Replaced all remaining hardcoded strings with proper i18n translation keys.
- **Filter UI Cleanup**: Removed extra animation and redundant button from filter controls.
- **Language Toggle Overflow**: Fixed language toggle overflowing its container on mobile Settings screen.

### Changed
- **README Documentation**: Updated README with latest project information.

---

## [0.1.0] - 2026-06-15

### Added
- **Internationalization (i18n)**: Integrated `i18next` and `react-i18next` for full translation support. Initial translations provided for English (`en`), Spanish (`es`), and French (`fr`). Fully externalized all UI strings (Welcome wizard, RecipeDetail, etc.).
- **Database Pagination, Filtering, and Sorting**: Added database-level paging, sorting, and filtering logic using Dexie.js for all main tables.
- **List Page Enhancements**: Updated history, recipes, beans, and equipment list pages with interactive pagination, page size selector, and collapsible filtering/sorting controls.
- **Editing Capabilities**: Added edit forms and buttons for Extractions, Recipes, and Beans to allow modification of logged items.
- **SCA Brewing Control Chart**: Implemented extraction yield (EY%) calculation and SCA brewing control zone analysis (`ideal`, `under`, `over`, `weak`, `strong`, `underdeveloped`) via the new `scaChart` utility and `useAlgorithm` hook.
- **Recipe Creation Modal**: Added a quick modal to create new recipes directly from the recipes list view.
- **Version Display System**: Added a dynamic version tracking system displaying the current version (0.1.0) in the sidebar and Settings screen.
- **Vercel Speed Insights**: Added analytics and speed measurement tools.
- **Vercel Analytics**: Integrated Vercel Web Analytics by adding the `<Analytics />` component to the application's layout.
- **Node 24 LTS Upgrade**: Switched the project to target Node 24 (the latest LTS version) for stability, configuring `.node-version`, `.nvmrc`, and `package.json` engines.

### Changed
- **Modular Components**: Refactored monolithic component file `UI.tsx` into clean, individual reusable components inside `src/components/`.
- **Decoupled Architecture**: Refactored `AppContext` to store only lightweight caches, with screens now loading and writing their own data directly through the `useDb` hook.
- **CSS Modules Transition**: Eliminated inline styles and moved component-specific styling to co-located CSS Modules (`styles.module.css`) to maintain clean style boundaries and keep `global.css` uncluttered.
- **PWA Quick Add Button Safe Areas**: Added padding to prevent the quick add button from being cut off by native tab bars and safe areas on iOS PWA installations.

### Fixed
- **Scroll Containment**: Prevented layout double-scrolling bugs by locking the body scroll and confining scrolling to the main content layout container.
- **Asset/Favicon Optimization**: Replaced default SVG favicon with a proper high-resolution PNG favicon and updated PWA manifest icons.
- **Modals Behavior**: Hid the PWA quick add floating button when modals are active.
- **CSS Import Shadowing**: Renamed CSS module imports in Settings screen to prevent namespace clashes with local state attributes.
- **Security & Dependency Maintenance**: Executed `npm audit fix` to ensure zero known vulnerabilities are present in project dependencies.
