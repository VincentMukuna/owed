# Owed

A mobile-first personal credit tracker for informal debts — who owes you, how much, when they promised to pay, and what it was for.

Owed is a private memory and follow-up tool, not a lending platform. It helps you stay clear on money owed without digging through chats or relying on memory.

## Stack

- [Expo SDK 56](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- React Native 0.85, React 19, TypeScript
- [Unistyles](https://www.unistyl.es/) for theming
- [expo-sqlite](https://docs.expo.dev/versions/v56.0.0/sdk/sqlite/) for local persistence (normalized SQLite schema)
- [Zustand](https://github.com/pmndrs/zustand) for ephemeral UI state (toasts)
- [TanStack Query](https://tanstack.com/query), React Hook Form, Zod

## Getting started

**Requirements:** Node.js, npm, and Xcode (iOS) or Android Studio (Android) for native builds.

```bash
npm install
npm start
```

From the Expo dev server you can open a development build, iOS simulator, Android emulator, or web.

Native runs:

```bash
npm run ios
npm run android
```

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` | Run on iOS device or simulator |
| `npm run android` | Run on Android device or emulator |
| `npm run web` | Start for web |
| `npm run lint` | ESLint (includes Prettier rules) |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Format `src/` with Prettier |
| `npm run format:check` | Check formatting in `src/` |

## Project structure

```
src/
  app/              # Expo Router routes (tabs, modals, dynamic debt/[id])
  components/       # Shared UI (ui/, shared/, debts/, navigation/)
  features/         # Screen logic by domain (dashboard, debts, activity, …)
  lib/              # API client, storage helpers, utilities
  styles/           # Unistyles themes and design tokens
  hooks/            # Shared hooks
  constants/        # App config
docs/               # PRD and design brief
```

Source files use **kebab-case** naming. Expo Router specials (`_layout.tsx`, `[id].tsx`) are excluded from filename lint rules.

## Documentation

Product and design specs live in [`docs/`](./docs/):

- [PRD](./docs/prd.md) — requirements, data model, MVP scope
- [Design brief](./docs/design-brief.md) — visual direction and screen specs

## MVP status

The current build persists debts, payments, and activity events in SQLite on device. Data survives app restarts. Core flows include onboarding, home summary, debt list and detail, add debt, record payment, activity feed, and settings.
