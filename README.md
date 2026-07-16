# Owwed

A mobile-first personal credit tracker for informal debts — who owes you, how much, when they promised to pay, and what it was for.

Owwed is a private memory and follow-up tool, not a lending platform. It helps you stay clear on money owed (in both directions) without digging through chats or relying on memory. Everything is stored locally on your device by default; there is no account and no server sync.

> **Naming note:** the product is branded **Owwed** (with the intentional double "w") in everything user-facing. The repository, npm package, URL scheme, and database file use the shorter slug **`owed`**. Both are correct — see [CONTRIBUTING.md](./CONTRIBUTING.md#naming).

## Features

- **Bi-directional debts** — track money people owe you and money you owe others.
- **People** — group debts by person, with per-person detail and history.
- **Payments & activity** — record full or partial payments; every change lands in an activity feed.
- **Home briefing** — daily summary, upcoming/attention debts, and paid-this-month insight.
- **Reminders** — optional local notifications on due dates, plus an in-app inbox. Nothing is sent to the other person.
- **App Lock** — four-digit PIN with optional biometrics and a privacy cover when backgrounded.
- **Backup & restore** — local-first, full-app backup files you own; destructive restore with confirmation.
- **CSV export** — export your debts for use elsewhere.
- **Multi-currency** — pick a currency and convert existing data with a suggested exchange rate.
- **Sorting & view options** — contextual, persistent ordering per screen.
- **Light/dark themes** — with selectable brand colors.

## Stack

- [Expo SDK 56](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- React Native 0.85, React 19, TypeScript
- [Unistyles](https://www.unistyl.es/) for theming
- [expo-sqlite](https://docs.expo.dev/versions/v56.0.0/sdk/sqlite/) for local persistence (normalized SQLite schema)
- [TanStack Query](https://tanstack.com/query) for data fetching/caching, [Zustand](https://github.com/pmndrs/zustand) for ephemeral UI state
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for forms and validation
- [Vitest](https://vitest.dev/) for unit tests

## Getting started

**Requirements:** Node.js 20+, npm, and Xcode (iOS) or Android Studio (Android) for native builds.

```bash
npm install
npm start
```

From the Expo dev server you can open a development build, iOS simulator, Android emulator, or web.

Native runs (require a connected device or configured simulator/emulator):

```bash
npm run ios
npm run android
```

Copy `.env.example` to `.env` if you want to configure optional integrations (marketing site link, feedback backend). All variables are `EXPO_PUBLIC_*` and are embedded in the client bundle, so never put secrets there.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` | Run on iOS device or simulator |
| `npm run android` | Run on Android device or emulator |
| `npm run web` | Start the marketing website (in `website/`) |
| `npm test` | Run unit tests once (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run typecheck` | Type-check the app with `tsc` |
| `npm run lint` | ESLint (includes Prettier rules) |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Format `src/` with Prettier |
| `npm run format:check` | Check formatting in `src/` |

## Project structure

```
src/
  app/              # Expo Router routes (tabs, modals, dynamic debt/[id], person/[id])
  components/       # Shared UI (ui/, shared/, debts/, navigation/, activity/)
  features/         # Screen logic by domain (dashboard, debts, people, activity, reminders,
                    #   app-lock, backup-restore, data-export, settings, onboarding, view-options)
  lib/              # DB client, storage helpers, query client, utilities
  styles/           # Unistyles themes and design tokens
  hooks/            # Shared hooks
  constants/        # App config
docs/               # PRDs, design brief, performance guide, decision records
website/            # Next.js marketing site (deployed separately)
```

Source files use **kebab-case** naming. Expo Router specials (`_layout.tsx`, `[id].tsx`) and DB migration files are excluded from filename lint rules.

## Documentation

Product, design, and architecture references live in [`docs/`](./docs/):

- [PRD](./docs/prd.md) — requirements, data model, scope
- [Design brief](./docs/design-brief.md) — visual direction and screen specs
- [Performance guide](./docs/performance.md) — **read before touching list screens, repositories, query hooks, or view mappers**
- Feature PRDs for persistence, reminders, people, backup/restore, app lock, currency, and more

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md) first. Security issues: see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Vincent Mukuna
