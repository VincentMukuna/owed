# Contributing to Owwed

Thanks for your interest in improving Owwed. This document explains how to get set up, the conventions the codebase follows, and what a good contribution looks like.

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting set up

1. Fork and clone the repo.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env` (optional — only needed for the feedback backend and marketing link).
4. Start the dev server: `npm start`, then open an iOS simulator, Android emulator, or a development build.

**Requirements:** Node.js 20+, npm, and Xcode (iOS) and/or Android Studio (Android) for native builds.

## Before you open a pull request

Run the full local check suite and make sure it passes:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint + Prettier rules
npm test            # Vitest
```

- Keep PRs focused. One logical change per PR is much easier to review.
- Add or update tests when you change behavior, especially around money math, status derivation, repositories, and backup/restore.
- Update relevant docs in `docs/` if you change a documented behavior or data model.
- Write clear commit messages describing the change and why.

## Conventions

### Naming

The product is branded **Owwed** (intentional double "w") everywhere user-facing: app display name, on-screen copy, and the marketing site. The shorter slug **`owed`** is used for technical identifiers: the npm package name, Expo `slug`, URL `scheme`, bundle identifiers, and the SQLite file (`owed.db`). When adding user-visible strings use **Owwed**; when adding code identifiers or config keys, match the surrounding **`owed`** convention.

### Files and folders

- Use **kebab-case** for file and folder names (`eslint-plugin-check-file` enforces this). Expo Router specials (`_layout.tsx`, `[id].tsx`) and DB migration files are exempt.
- Organize screen logic under `src/features/<domain>/` (screens, components, hooks, lib, repositories, schemas). Truly shared UI goes in `src/components/`.

### Performance

Owwed must stay fast with hundreds of debts and activity events. **Read [`docs/performance.md`](./docs/performance.md) before touching list screens, repositories, query hooks, or view mappers.** In short:

- List debts with `listSummaries()` (no payments); use `getById()` only for single-debt detail.
- Use `FlashList` (`DebtList`, `ActivityList`) for long lists — never `ScrollView` + `.map()`.
- Local SQLite queries use `staleTime: Infinity`; invalidate only in mutations.

### Data model changes

Persistence uses a normalized SQLite schema with a migration runner (`src/lib/db/migrations/`). Add a new migration rather than editing existing ones, and confirm backup/restore compatibility (see `docs/backup-restore-implementation-plan.md`).

## Building your own copy

The app ships under the maintainer's iOS/Android bundle identifier (`com.vincentmukuna.owed`) and Expo project. To build and publish your own fork, change the `bundleIdentifier`/`package` in `app.json` and the `extra.eas.projectId` to your own values. You do not need to change these to run the app locally in a simulator/emulator.

## Reporting bugs and requesting features

Use the GitHub issue templates. For security-sensitive reports, follow [SECURITY.md](./SECURITY.md) instead of opening a public issue.
