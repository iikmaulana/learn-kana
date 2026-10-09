# Copilot Instructions for learn-kana

## Project shape

This repository is a single-page React app for practicing hiragana and katakana in the browser. It is intentionally client-only: there is no backend, database, or API layer. Progress, settings, language preference, and the selected kana groups are stored in browser `localStorage`.

Key entry points:
- `src/index.js`: app bootstrap, router setup, service worker registration, and analytics initialization.
- `src/App.js`: main menu shell that renders the home screen and game menu.
- `src/pages/InGame.js`: the active quiz/game screen.
- `src/components/*`: reusable UI pieces such as the navbar, kana group selectors, game mode controls, and score modal.
- `src/kanaCharacters.js`: kana definitions and grouped sets used by the game.
- `src/i18n.js`: translation table for English and Indonesian, plus the language provider and localStorage persistence.
- `src/serviceWorkerRegistration.js` and `src/service-worker.js`: PWA/offline behavior and update flow.

The app uses React Router (`react-router-dom`) with a layout wrapper and a catch-all `NotFound` route. New pages should be added to the router defined in `src/index.js` and should usually follow the existing `Layout` pattern instead of creating a separate app shell.

## Commands

Install dependencies:
```bash
npm install
```

Run locally:
```bash
npm start
```
The app runs on `http://localhost:3000` in development mode.

Production build:
```bash
npm run build
```
Build output is written to `./build`.

Test commands:
```bash
CI=true npm test -- --watch=false --runInBand
```
To run a single test file:
```bash
CI=true npm test -- --watch=false --runInBand --runTestsByPath src/path/to/file.test.js
```
Test files live next to the code they cover as `src/**/*.test.js` (e.g. `src/components/InGameCharacterShowAndInput.test.js`, which covers the words / long-typing practice mode). Shared Jest setup (jest-dom matchers) is in `src/setupTests.js`.

Linting:
- There is no `npm run lint` script in `package.json`.
- CRA’s ESLint config is present via `react-app` / `react-app/jest`, but linting is not exposed as a repo script.

## Conventions specific to this codebase

- Prefer browser-local persistence over introducing a backend/data layer. Keys like `checkedKanas`, `game-mode-word`, `game-mode-touch`, `game-mode-auto-next`, and `userStats` are part of the app’s established state model.
- Translation work belongs in `src/i18n.js`; every new UI string should be added to both `en` and `id` entries unless intentionally falling back to English.
- Game configuration and user stats are controlled by localStorage-backed flags, so changes to settings often require following the existing key names instead of inventing a new config format.
- The app is a static PWA and should remain deployable as a client-only build. Do not add server-side auth, database access, or API calls unless the project is explicitly expanded beyond its current design.
- Styling is mostly traditional CSS files (`App.css`, `InGame.css`, and component-local CSS files), not CSS modules. New styles should match that pattern unless a broader refactor is already underway.
- Fonts are tracked in `src/fonts` and imported directly, so asset changes often need checking in both the imports and the generated bundle behavior.
- Route additions and app bootstrap changes are centralized in `src/index.js`; avoid scattering router configuration into components.

## Practical guidance for changes

- When updating gameplay behavior, check the kana-selection flow and the game state logic together; they are tightly coupled through `localStorage` and the selected kana groups.
- When adding new settings, follow the established naming pattern (`game-mode-*`) and keep the values readable in localStorage for debugging and compatibility.
- When editing the menu/game UI, review both the relevant component and the corresponding game logic in `src/pages/InGame.js` or the related interactive components to keep the UX and persisted settings aligned.
- Treat the project as a front-end-only learning app: minimize dependencies and keep browser compatibility in mind because the app is intended to run directly in the user’s browser and on mobile devices.
