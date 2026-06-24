# PRD: v0.2 Local Persistence (SQLite)

**Status:** In progress (PRs 1–2 merged; see [delivery plan](#12-delivery-plan))  
**Milestone:** [v0.2 — Local persistence (SQLite)](https://github.com/VincentMukuna/owed/milestone/1)  
**Baseline release:** [v0.1.0-mvp](https://github.com/VincentMukuna/owed/releases/tag/v0.1.0-mvp)  
**Next branch:** `feature/activity-repository` (PR 3 / issue [#3](https://github.com/VincentMukuna/owed/issues/3))

This document captures product intent, architecture decisions, and implementation guidance for the persistence sprint. It is written for an implementing agent (or future contributor) who may not have prior chat context.

**Related docs**

| Document | Role |
|----------|------|
| [prd.md](./prd.md) | Original product requirements and long-term data model |
| [design-brief.md](./design-brief.md) | UI/UX — should not change in this sprint |
| [README.md](./README.md) | Docs index |

**Expo version:** SDK 56 — read [Expo v56 docs](https://docs.expo.dev/versions/v56.0.0/) before adding native modules. Prefer `expo-sqlite` from the Expo SDK.

---

## 1. Summary

v0.1 shipped a working UI MVP with **in-memory Zustand state** and **sample data that resets on every launch**. v0.2 makes the app a real personal tool: **debts, payments, and activity survive app restarts** using **SQLite on device**.

No backend, no auth, no sync. Local-only, private, offline-first.

---

## 2. Problem

Today the app cannot be used as a memory aid because:

1. All debt data lives in `useAppStore` and is re-seeded from `sample-data.ts` on launch.
2. `src/app/_layout.tsx` explicitly calls `useAppStore.getState().reset()` in a `useEffect` on mount — wiping any in-session changes on cold start anyway.
3. Activity feed data is static sample data; `addDebt` / `addPayment` never append activities.
4. Settings (`useSettingsStore`) and onboarding completion are in-memory only (AsyncStorage helpers exist but are unused).

The UI and navigation are done. This sprint is **data layer only** — screens should keep working with minimal visual change.

---

## 3. Goals

| # | Goal |
|---|------|
| G1 | Debts and payments persist across app kills and relaunches |
| G2 | Activity feed reflects real user actions and persists |
| G3 | Fresh install shows real empty states (no fake sample debts) |
| G4 | Use **React Query** for async persisted data; slim **Zustand** to UI-only state |
| G5 | Introduce a clear **repository → SQLite** boundary testable without UI |
| G6 | Land work in small PRs; `main` stays runnable after each merge |

---

## 4. Non-goals (this sprint)

- Cloud sync, backup, or export
- Auth or multi-user (`users` table not needed — single device, single implied user)
- Reminder scheduling / push notifications (`reminders` table deferred)
- Persisting settings / onboarding flag (optional follow-up; AsyncStorage keys already stubbed in `local-storage.ts`)
- Edit/delete/archive debt **UI** flows (schema supports `archived_at`; screens may not exist yet)
- Web-specific storage fallback (mobile-first; iOS/Android are the target)
- Comprehensive automated test suite (manual test plan is required; unit tests for repos are a plus)

**In scope for data model:** normalized `people`, `debts`, `payments`, and `activity_events` — not the denormalized v1 UI shape.

---

## 5. Architecture decisions

These were agreed before implementation and should not be re-litigated without good reason.

### 5.1 State ownership

```
┌─────────────────────────────────────────────────────────┐
│  Screens (existing feature components)                   │
└───────────────┬─────────────────────┬───────────────────┘
                │                     │
                ▼                     ▼
     ┌──────────────────┐   ┌──────────────────┐
     │  React Query      │   │  Zustand (small)  │
     │  debts, payments, │   │  toast only       │
     │  activities       │   │                   │
     └─────────┬────────┘   └──────────────────┘
               │
               ▼
     ┌──────────────────┐
     │  Repositories     │  async functions, no React
     │  person-repository│
     │  debt-repository  │
     │  payment (in debt)│
     │  activity-repo    │
     └─────────┬────────┘
               │
               ▼
     ┌──────────────────┐
     │  SQLite (expo)    │
     │  src/lib/db/      │
     └──────────────────┘
               │
               ▼
     ┌──────────────────┐
     │  Mappers + derive │  initials, status, remaining,
     │  (pure functions) │  formatted dates, activity copy
     └──────────────────┘
```

**Why React Query for persisted data**

SQLite I/O is async. Multiple screens read the same debts (home, debts list, detail). React Query provides:

- Loading / error states
- Cache shared across screens via query keys
- Refetch after mutations (`invalidateQueries`)
- A standard pattern for “read from disk, write, refresh UI”

**Why keep Zustand**

Toast is ephemeral UI state with a timer — not server/persisted data. Keep `toast`, `showToast`, `clearToast` in a small store (rename optional: `use-ui-store.ts`). **Remove** `debts`, `activities`, `addDebt`, `addPayment`, `getDebt`, `reset` from the app store.

**Do not** hold the same debt list in both Zustand and React Query.

### 5.2 Storage split

| Data | Store | Notes |
|------|-------|-------|
| Debts, payments, activities | SQLite | Source of truth |
| Toast | Zustand | Ephemeral |
| Settings, onboarding | AsyncStorage | Out of scope unless trivial; keys exist in `storageKeys` |

### 5.3 Repository pattern

Repositories are plain TypeScript modules with async functions. No React imports.

```ts
// Example shape — repositories accept/return domain types, not UI view models
export const debtRepository = {
  list(): Promise<DebtWithRelations[]>,
  getById(id: string): Promise<DebtWithRelations | undefined>,
  create(input: CreateDebtInput): Promise<DebtWithRelations>,
  recordPayment(debtId: string, input: RecordPaymentInput): Promise<DebtWithRelations>,
};

export const personRepository = {
  findOrCreateByName(name: string): Promise<Person>,
};
```

React Query hooks wrap repositories in `src/features/debts/hooks/` (or similar). Hooks return **view models** assembled by mappers so screens need minimal churn.

### 5.4 Query keys

Use a consistent key factory:

```ts
export const debtKeys = {
  all: ["debts"] as const,
  detail: (id: string) => ["debts", id] as const,
};

export const activityKeys = {
  all: ["activities"] as const,
};
```

Invalidate `debtKeys.all` after create/payment; invalidate `debtKeys.detail(id)` when that debt changes; invalidate `activityKeys.all` when activity is written.

### 5.5 Data access: raw SQL (not Drizzle)

**Decision:** use `expo-sqlite` async APIs with **hand-written SQL** in repositories. Do **not** add Drizzle for v0.2.

**Why raw SQL fits this sprint**

- **Small schema** — three domain tables plus a migrations ledger. Total query surface is a handful of `SELECT` / `INSERT` / `UPDATE` calls.
- **React Query is already the DX layer** — loading, cache, and refetch live at the hook boundary. An ORM would duplicate concerns without much gain at this scale.
- **Less setup risk** — Drizzle on Expo needs `drizzle-kit`, Metro `.sql` extensions, and a Babel inline-import plugin. That’s real friction on PR #1 when the goal is “data survives restart.”
- **Easier to debug first-time RN persistence** — fewer abstractions between you and the on-device `.db` file.

**When to revisit Drizzle (post–v0.2)**

- Schema grows past ~6 tables or frequent migrations become painful
- Complex joins / relations multiply
- You’re tired of maintaining row mappers by hand

Drizzle is a good tool and common in modern Expo apps — it’s just **optional overhead** for a 3-table hobby sprint. Raw SQL in repositories is a normal, respected pattern in React Native (many production apps use `expo-sqlite` or `op-sqlite` directly).

**Repository rule:** all SQL strings live in `src/lib/db/` or repository files — never in screen components.

---

## 6. Current codebase map

### 6.1 Files that own data today

| File | Role today | Action in v0.2 |
|------|------------|----------------|
| `src/features/debts/store/app-store.ts` | Debts, activities, mutations, toast | Strip to toast-only OR new `ui-store.ts` |
| `src/features/debts/data/sample-data.ts` | `INITIAL_DEBTS`, `INITIAL_ACTIVITIES` | Remove from runtime path; delete or keep for dev seed script only |
| `src/features/debts/types.ts` | Denormalized UI types (`initials`, `status`, …) | **Replace** with view models derived from domain types |
| `src/types/index.ts` | Canonical domain types (`Person`, `Debt`, `Payment`) | **Source of truth** — extend if needed |
| `src/lib/api/query-client.ts` | QueryClient config | Keep; tune `staleTime` if needed |
| `src/app/_layout.tsx` | `QueryClientProvider`, **`reset()` on mount** | **Remove `reset()`**; optionally init DB here |
| `src/lib/storage/local-storage.ts` | AsyncStorage helpers + `storageKeys` | Unchanged this sprint unless doing settings |

### 6.2 Screens consuming `useAppStore` (must migrate)

| Screen | Usage |
|--------|-------|
| `src/features/dashboard/screens/home-screen.tsx` | `debts` |
| `src/features/debts/screens/debts-screen.tsx` | `debts` |
| `src/features/debts/screens/debt-detail-screen.tsx` | `getDebt(id)` |
| `src/features/debts/screens/add-debt-screen.tsx` | `addDebt` |
| `src/features/debts/screens/record-payment-screen.tsx` | `getDebt`, `addPayment` |
| `src/features/activity/screens/activity-screen.tsx` | `activities` |
| `src/components/shared/toast.tsx` | `toast`, `clearToast` |

### 6.3 V1 UI debt to shed (do not persist)

The v1 `src/features/debts/types.ts` shape was built for screens, not storage. **None of these belong in SQLite:**

| V1 field | Replacement |
|----------|-------------|
| `initials` | Derive via `getInitials(person.name)` at map time |
| `name` on debt | `people.name` via `person_id` FK |
| `remaining` | `original_amount - SUM(payments.amount)` |
| `status` | `computeDebtStatus({ remaining, original, dueDate, now })` |
| `dueDate` / `addedDate` display strings | Store ISO; format with date formatters at map time |
| `amount` | `debts.original_amount` |
| Activity `text` / `sub` / `time` | Store event facts; build copy in `buildActivityView()` |

### 6.4 Known MVP gaps to fix while persisting

1. **Activities never update** — write `activity_events` rows when debts/payments are created.
2. **`reset()` on launch** — remove; data loads from SQLite via React Query.
3. **Two type files** — consolidate on `src/types/index.ts` for domain; add `src/features/debts/view-models.ts` (or `mappers/`) for UI assembly.
4. **IDs** — use **TEXT UUID** via `createId()` in `src/lib/id.ts` (do not call `crypto.randomUUID()` directly — it is unreliable on React Native); not `Date.now()` integers.
5. **Add-debt screen** — currently writes fake `addedDate: "Jun 24"` and `status: "active"`; form should submit `CreateDebtInput` only (person name, amount, due date, reason, reminder flags).

---

## 7. Data model (SQLite v1 — normalized)

Aligned with [prd.md §9–10](./prd.md). **The database stores facts; the app derives presentation.**

### 7.1 Design principles

1. **Normalize entities** — `people` and `debts` are separate; payments are child rows.
2. **Never store derived data** — no `initials`, `status`, `remaining_amount`, or pre-rendered activity copy.
3. **ISO timestamps in, formatted strings out** — `TEXT` columns hold ISO 8601; human labels are computed in mappers.
4. **INTEGER amounts** — store whole currency units (KES) as integers to avoid float drift.
5. **UUID primary keys** — `TEXT` ids via `createId()` (`src/lib/id.ts`); matches `src/types/index.ts`.
6. **No `users` table** — single local user; settings live in AsyncStorage later. `people` are global on device.

### 7.2 Entity relationships

```
people ─────┬────< debts ─────< payments
            │
            └────< activity_events (also refs debt_id, optional payment_id)
```

### 7.3 Table: `people`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `name` | TEXT NOT NULL | Display name ("Brian Mwangi") |
| `phone_number` | TEXT NULL | Optional; not in add-debt form yet |
| `notes` | TEXT NULL | Optional |
| `created_at` | TEXT NOT NULL | ISO datetime |
| `updated_at` | TEXT NOT NULL | ISO datetime |

**Person resolution on add debt:** `findOrCreateByName(trimmed name)` — exact match on `name` (case-sensitive or normalize to lowercase for lookup; document choice in repo). Re-use person when the same name is entered again.

### 7.4 Table: `debts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `person_id` | TEXT NOT NULL | FK → `people.id` |
| `original_amount` | INTEGER NOT NULL | Whole currency units |
| `currency` | TEXT NOT NULL | Default `KES` from `APP_CONFIG` |
| `reason` | TEXT NULL | Context / note |
| `due_date` | TEXT NOT NULL | ISO date (`YYYY-MM-DD`) |
| `lent_date` | TEXT NULL | ISO date; optional |
| `reminder_enabled` | INTEGER NOT NULL | 0/1 |
| `reminder_time` | TEXT NULL | e.g. `09:00`; optional |
| `archived_at` | TEXT NULL | Set when archived; exclude from default lists |
| `created_at` | TEXT NOT NULL | ISO datetime |
| `updated_at` | TEXT NOT NULL | ISO datetime |

**Not stored:** `remaining`, `status`, `initials`, `person_name` (join `people`).

### 7.5 Table: `payments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `debt_id` | TEXT NOT NULL | FK → `debts.id` ON DELETE CASCADE |
| `amount` | INTEGER NOT NULL | Whole currency units |
| `paid_at` | TEXT NOT NULL | ISO datetime |
| `note` | TEXT NULL | |
| `created_at` | TEXT NOT NULL | ISO datetime |

**Remaining balance:** always computed, never updated in place:

```sql
original_amount - COALESCE((SELECT SUM(amount) FROM payments WHERE debt_id = ?), 0)
```

### 7.6 Table: `activity_events`

Store **what happened**, not how it reads in the feed.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `type` | TEXT NOT NULL | `debt_created` \| `payment_recorded` \| `debt_paid` |
| `debt_id` | TEXT NOT NULL | FK → `debts.id` |
| `payment_id` | TEXT NULL | FK → `payments.id` when type is payment-related |
| `person_id` | TEXT NOT NULL | FK → `people.id` (denormalized for feed queries without extra join — acceptable) |
| `amount` | INTEGER NULL | Payment amount when relevant |
| `occurred_at` | TEXT NOT NULL | ISO datetime |
| `created_at` | TEXT NOT NULL | ISO datetime |

**Feed copy** is built at read time, e.g.:

```ts
// payment_recorded → "Brian paid KES 1,000" / "M-Pesa partial · Transport + drinks"
buildActivityView(event, { person, debt, payment })
```

`debt_overdue` events are **out of scope** for v0.2 (would need a scheduler or on-open scan).

### 7.7 Table: `schema_migrations`

| Column | Type | Notes |
|--------|------|-------|
| `version` | INTEGER PK | Applied migration version |

### 7.8 Derived fields (mappers only)

Implement in `src/lib/db/mappers.ts` or `src/features/debts/lib/compute-debt-status.ts`:

| Output (view model) | Source |
|---------------------|--------|
| `initials` | `getInitials(person.name)` |
| `personName` | `person.name` |
| `remainingAmount` | `original_amount - sum(payments)` |
| `status` | `computeDebtStatus(...)` — see below |
| `dueDate` (display) | `formatDueDate(debt.due_date)` |
| `addedDate` (display) | `formatAddedDate(debt.created_at)` |
| `payments[].date` (display) | `formatPaymentDate(payment.paid_at)` |

### 7.9 Status computation

Single `DebtStatus` for UI badges/filters. Priority order:

```ts
function computeDebtStatus(input: {
  originalAmount: number;
  remainingAmount: number;
  dueDate: string; // ISO date
  now?: Date;
}): DebtStatus {
  const { originalAmount, remainingAmount, dueDate } = input;
  const now = input.now ?? new Date();

  if (remainingAmount <= 0) return "paid";
  if (remainingAmount < originalAmount) return "partial"; // partial wins over overdue in v1 UI
  if (isBefore(parseISO(dueDate), startOfDay(now))) return "overdue";
  if (isWithinDays(dueDate, now, 3)) return "due-soon";
  return "active";
}
```

`partial` takes precedence over `overdue`/`due-soon` to match current v1 badge behavior (a partially paid debt shows the partial badge). Document in code; adjust if product changes.

`archived` status: when `archived_at IS NOT NULL`, exclude from `list()` or map to a separate filter later.

### 7.10 Domain types vs view models

| Layer | Location | Purpose |
|-------|----------|---------|
| **Domain** | `src/types/index.ts` | `Person`, `Debt`, `Payment`, `ActivityItem` — matches DB rows + relations |
| **DB rows** | `src/lib/db/row-types.ts` | Optional snake_case row interfaces for `getAllAsync<T>` |
| **View models** | `src/features/debts/view-models.ts` | `DebtCardView`, `DebtDetailView`, `ActivityView` — what screens consume today |

Screens should migrate to view models that mirror the old shape (`remaining`, `dueDate` string, `status`, etc.) but are **assembled by mappers**, not read from SQLite columns.

### 7.11 Example mapper output

```ts
type DebtCardView = {
  id: string;
  name: string;           // person.name
  initials: string;       // derived
  amount: number;         // original_amount
  remaining: number;      // derived
  dueDate: string;        // formatted
  reason: string;
  status: DebtStatus;     // derived
  addedDate: string;      // formatted created_at
  payments: PaymentView[];
  reminder: boolean;      // reminder_enabled
};
```

This keeps UI churn low while the schema stays clean.

### 7.12 Initial migration SQL (reference)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE people (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE debts (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  original_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  reason TEXT,
  due_date TEXT NOT NULL,
  lent_date TEXT,
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY NOT NULL,
  debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  paid_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE activity_events (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES payments(id) ON DELETE SET NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  amount INTEGER,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL
);

CREATE INDEX idx_debts_person_id ON debts(person_id);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_payments_debt_id ON payments(debt_id);
CREATE INDEX idx_activity_events_occurred_at ON activity_events(occurred_at DESC);
```

---

## 8. Suggested folder layout

```
src/lib/db/
  client.ts                    # openDatabaseAsync, singleton, getDb()
  row-types.ts                 # PeopleRow, DebtsRow, … (snake_case)
  migrations/
    index.ts                   # runMigrations(db)
    001-initial.ts             # CREATE TABLE (see §7.12)
  mappers.ts                   # row → domain; domain → view model

src/features/debts/
  lib/
    compute-debt-status.ts     # pure status logic (§7.9)
    build-activity-view.ts     # event → feed copy
    format-dates.ts            # ISO → "Fri, 28 Jun", etc.
  repositories/
    person-repository.ts       # findOrCreateByName
    debt-repository.ts         # CRUD + recordPayment (inserts payment row)
    activity-repository.ts     # insert event, list for feed
  hooks/
    use-debts.ts               # returns DebtCardView[]
    use-debt.ts                # returns DebtDetailView
    use-add-debt.ts
    use-record-payment.ts
    use-activities.ts            # returns ActivityView[]
  view-models.ts               # DebtCardView, ActivityView, …
  store/
    ui-store.ts                # toast only

src/types/index.ts             # canonical domain types (source of truth)
```

Follow existing **kebab-case** file naming.

### 8.1 Raw SQL patterns (expo-sqlite)

Use the **async** API (`openDatabaseAsync`, `getAllAsync`, `runAsync`, `getFirstAsync`). Repositories call `getDb()` then execute SQL.

```ts
// client.ts — singleton
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

const DB_NAME = "owed.db";
let dbPromise: Promise<SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) dbPromise = openDatabaseAsync(DB_NAME);
  return dbPromise;
}
```

```ts
// debt-repository.ts — list with join
const rows = await db.getAllAsync<DebtListRow>(`
  SELECT
    d.*,
    p.name AS person_name,
    COALESCE((SELECT SUM(amount) FROM payments WHERE debt_id = d.id), 0) AS paid_total
  FROM debts d
  INNER JOIN people p ON p.id = d.person_id
  WHERE d.archived_at IS NULL
  ORDER BY d.due_date ASC
`);
return rows.map((row) => toDebtCardView(row, paymentsByDebtId));
```

```ts
// migrations/index.ts — simple version ledger
// 1. Read max(version) from schema_migrations
// 2. For each pending migration, run execAsync in a transaction
// 3. INSERT version row on success
```

Keep migration SQL in one place per version. PR #1 only creates empty tables — no repository reads yet.

---

## 9. React Query integration patterns

### 9.1 Read debts

```ts
export function useDebts() {
  return useQuery({
    queryKey: debtKeys.all,
    queryFn: () => debtRepository.list(),
  });
}
```

Screens replace `useAppStore((s) => s.debts)` with `const { data: debts = [], isLoading, isError } = useDebts()` and show existing empty/loading UI patterns.

### 9.2 Add debt

```ts
export function useAddDebt() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtRepository.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: debtKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      showToast("Debt saved.");
    },
  });
}
```

### 9.3 Record payment

`debtRepository.recordPayment` must:

1. `INSERT` into `payments` (do not mutate a `remaining` column — there isn't one).
2. Re-read debt with payments; derive `remainingAmount`.
3. `INSERT` `activity_events` (`payment_recorded`; if `remainingAmount === 0` also `debt_paid` or single event with type `debt_paid`).
4. Return mapped `DebtDetailView`.

Toast messages unchanged: full → `"Debt marked as paid."`; partial → `"Payment recorded."`

Invalidate `debtKeys.all`, `debtKeys.detail(debtId)`, `activityKeys.all`.

### 9.4 App startup

1. Open SQLite and run migrations (before or as part of first query).
2. **Do not** call sample-data reset.
3. Optional: global loading gate in root layout until migrations complete — only if needed; prefer lazy init on first query.

`QueryClientProvider` is already in `src/app/_layout.tsx`.

---

## 10. Activity event rules

Insert into `activity_events` (not pre-formatted strings):

| User action | `type` | `amount` | Notes |
|-------------|--------|----------|-------|
| Debt created | `debt_created` | `original_amount` | `person_id`, `debt_id` set |
| Payment recorded (partial) | `payment_recorded` | payment amount | `payment_id` set |
| Payment clears debt | `debt_paid` | payment amount | Can be one row or `payment_recorded` + `debt_paid` — pick one pattern |

`buildActivityView()` uses `person.name`, `debt.reason`, `formatCurrency(amount)`, and `formatRelativeTime(occurred_at)` to produce `text`, `sub`, `time` for the feed.

Map event `type` to UI `ActivityType`: `debt_created` → `add`, `payment_recorded` → `payment`, `debt_paid` → `paid`.

Use `APP_CONFIG` / `src/lib/utils/formatters.ts` for currency and initials.

---

## 11. Git workflow

Already configured on the repo:

| Item | Detail |
|------|--------|
| `main` | Protected — requires PR to merge |
| Tag `v0.1.0-mvp` | Pre-persistence snapshot |
| Milestone | v0.2 — Local persistence (SQLite) |
| Release target | Tag `v0.2.0` when milestone complete |

**No `dev` branch** — use short-lived `feature/*` branches off `main`.

### Commit style

Continue [Conventional Commits](https://www.conventionalcommits.org/): `feat(db):`, `feat(debts):`, `refactor:`.

---

## 12. Delivery plan

Work is split into five PRs matching GitHub issues. Each PR should leave the app buildable.

| PR | Branch | Issue | Scope | Status |
|----|--------|-------|-------|--------|
| 1 | `feature/sqlite-setup` | [#1](https://github.com/VincentMukuna/owed/issues/1) | `expo-sqlite`, **normalized schema** (§7), migration runner | **Merged** ([#6](https://github.com/VincentMukuna/owed/pull/6)) |
| 2 | `feature/debt-repository` | [#2](https://github.com/VincentMukuna/owed/issues/2) | Person + debt repos, mappers, view models, React Query hooks, wire screens | **Merged** ([#7](https://github.com/VincentMukuna/owed/pull/7)); also shipped onboarding AsyncStorage (see [§18](#18-agent-checklist-start-here)) |
| 3 | `feature/activity-repository` | [#3](https://github.com/VincentMukuna/owed/issues/3) | Persist activities on create/payment; activity screen from DB | **Next** |
| 4 | `feature/db-hydration` | [#4](https://github.com/VincentMukuna/owed/issues/4) | Remove `reset()`, loading states, query-driven startup | Pending |
| 5 | `feature/remove-sample-data` | [#5](https://github.com/VincentMukuna/owed/issues/5) | Delete sample bootstrap, update README | Pending |

**PR body template:** what changed, why this slice, manual test plan, `Closes #N`.

---

## 13. Acceptance criteria (milestone complete)

- [ ] Fresh install: no debts, no activities, real empty states
- [ ] Same person name on second debt reuses `people` row (find-or-create)
- [ ] `initials` and `status` correct on list without being stored in DB
- [ ] `remaining` updates after payment via sum of `payments`, not a stored column
- [ ] Add debt with all required fields → appears on home, debts list, and detail
- [ ] Record partial payment → remaining and status update everywhere
- [ ] Record full payment → status `paid`, correct toast
- [ ] Activity feed shows add/payment events in sensible order
- [ ] Force-quit app (swipe away) → relaunch → all data intact
- [ ] No imports of `INITIAL_DEBTS` / `INITIAL_ACTIVITIES` in runtime code
- [ ] No `useAppStore` debt/activity usage in screens
- [ ] `npm run lint` passes
- [ ] iOS dev build runs (`npx expo run:ios`)

---

## 14. Manual test plan

Run on a **physical device or simulator** with a dev build (SQLite needs native module after install).

1. **Empty state** — delete app, reinstall, confirm no sample debts.
2. **Create** — add one debt, verify all tabs.
3. **Persistence** — kill app, reopen, verify debt remains.
4. **Partial payment** — record partial, verify remaining + activity entry.
5. **Full payment** — record remaining balance, verify paid status + activity.
6. **Multiple debts** — add 3+, verify sort order on debts screen matches pre-persistence behavior.
7. **Person reuse** — add two debts for the same name; confirm one `people` row, two `debts` rows.
8. **Regression** — onboarding, navigation, FAB add flow, modals still work.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `expo-sqlite` native rebuild required | Run `npx expo run:ios` / `run:android` after install; document in PR |
| Large bang refactor breaks all screens | Follow 5-PR plan; migrate one screen at a time inside PR 2 if needed |
| Mapper bugs (wrong status/dates) | Unit-test `computeDebtStatus` and one mapper fixture; centralize in `lib/` |
| Two type files diverge | Delete `src/features/debts/types.ts` after view models land; import from `view-models.ts` + `src/types/index.ts` |
| Duplicate state (Zustand + RQ) | Delete debt fields from Zustand in same PR that adds hooks |
| Migration failures on upgrade | Version `schema_migrations`; test migration from empty DB only for v0.2 |

---

## 16. After v0.2 (not this sprint)

- Consider **Drizzle** if migration count grows (see [§5.5](#55-data-access-raw-sql-not-drizzle))
- `reminders` table + Expo Notifications
- Persist **settings** via `local-storage.ts` (onboarding completion is already persisted — see `src/features/onboarding/lib/onboarding-storage.ts`)
- Edit / delete / archive UI wired to `archived_at`
- `debt_overdue` activity generation (on-app-open or scheduled)
- Export / backup
- `CHANGELOG.md` + GitHub release `v0.2.0`

---

## 17. Reference: payment business rules

Preserve v1 **behavior**; implementation changes because `remaining` is derived:

```ts
const remainingBefore = debt.originalAmount - sumPayments(debt.payments);
const isFullPayment = amount >= remainingBefore;
// INSERT payment row only — do not UPDATE debts.original_amount
const remainingAfter = remainingBefore - amount;
// Toast: isFullPayment → "Debt marked as paid." ; else → "Payment recorded."
// activity_events: payment_recorded; if remainingAfter <= 0 → debt_paid
```

Status after payment comes from `computeDebtStatus`, not manual `partial` / `paid` writes.

---

## 18. Agent checklist (start here)

**Current slice:** PR 3 — `feature/activity-repository` off `main`.

1. Read this doc — especially [§7](#7-data-model-sqlite-v1--normalized) and [§6.3](#63-v1-ui-debt-to-shed-do-not-persist).
2. Branch from `main`. PRs 1–2 are merged; do not re-implement debt repos or screen wiring.
3. Read Expo v56 `expo-sqlite` docs. Raw SQL only (§5.5). **Do not** mirror v1 denormalized columns.
4. Use `src/types/index.ts` for domain types; screens consume `src/features/debts/view-models.ts`.

### Implementation notes (not obvious from code)

| Topic | Detail |
|-------|--------|
| **UUIDs** | Always `createId()` from `src/lib/id.ts`. Bare `crypto.randomUUID()` throws on device. |
| **Debt create** | `debtRepository.create` returns an assembled row after `INSERT` — do not re-fetch with `getById` (caused false save failures on device). |
| **Activity feed** | `activity-screen.tsx` still imports `INITIAL_ACTIVITIES` from `sample-data.ts` until PR 3. |
| **`reset()`** | `_layout.tsx` still calls `useUiStore.getState().reset()` on mount (toast-only). Remove in PR 4. |
| **Onboarding** | Shipped early in PR 2 (`onboarding-storage.ts`, `storageKeys.onboardingComplete`). Do not redo. |
| **Debt mutations** | `use-add-debt` / `use-record-payment` already invalidate `activityKeys.all` — wire repo writes in PR 3. |

5. Implement PR 3 only — `activity-repository`, `use-activities`, activity screen from SQLite; insert events in debt create/payment paths.
6. Remove `useUiStore.getState().reset()` in PR 4, not PR 3.
7. Open PR against `main`; `Closes #3`.
