# Performance & scaling guidelines

**Status:** Active — mandatory for all list and data-layer work  
**Related:** [persistence-prd.md](./persistence-prd.md) (data layer), [prd.md](./prd.md) (product model)

Guidelines for keeping Owed responsive as debt and activity data grows. Follow these patterns when adding or changing list screens, repositories, query hooks, and mappers.

---

## 1. Design targets

Owed is a local SQLite app that should stay responsive over months/years of use.

| Surface | Target |
|---------|--------|
| Cold start → first tab | Data prefetched before tabs mount; no multi-second blank screen |
| Home / Debts / Activity lists | Smooth scroll with **hundreds** of rows |
| Debts filter tabs | Instant filter switch; list scrolls to top |
| Debt detail | Full payment history (single debt only) |

**Load testing:** Settings → Developer → **Seed sample data** (dev builds only). Re-run to add more rows.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Screens (Home, Debts, Activity)                             │
│  • FlashList for long lists                                  │
│  • useMemo + debt-list-utils (single-pass bucket/filter)     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  React Query hooks (useDebts, useActivities, useDebt)        │
│  • staleTime: Infinity for local SQLite                      │
│  • queryFn: repository read → map to view (shared w/ prefetch) │
│  • invalidateQueries only in mutations                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Repositories                                                  │
│  • listSummaries() / getById() — domain shapes only            │
└──────────────────────────┬────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  SQLite                                                        │
│  • Aggregated paid_total subquery for lists                    │
│  • Indexes on debts(due_date), payments(debt_id), etc.         │
└───────────────────────────────────────────────────────────────┘
```

### Prefetch on launch

`src/app/_layout.tsx` waits for DB init **and** prefetches `debtKeys.all` + `activityKeys.all` before rendering the stack. Tab screens should read from warm cache on first paint.

---

## 3. Database & repositories

| Guideline | Detail |
|-----------|--------|
| **List queries return summaries** | Use `debtRepository.listSummaries()` (alias `list()`) for any screen showing many debts. Returns `DebtSummary` — **no `payments` array**. |
| **Detail queries load relations** | Use `debtRepository.getById()` only for debt detail, record payment, or other single-debt flows. |
| **Aggregate in SQL** | Compute `remaining` via `SUM(payments.amount)` in SQL (`paid_total` subquery). Do not load all payment rows to sum in JS for list paths. |
| **No N+1 payment fetches on lists** | Do not call `fetchPaymentsByDebtIds` from list code paths. |
| **Never store derived fields** | `remaining`, `status`, and formatted dates are computed at read time (per persistence PRD). |

Required list query pattern:

```sql
LEFT JOIN (
  SELECT debt_id, SUM(amount) AS paid_total
  FROM payments
  GROUP BY debt_id
) pay_totals ON pay_totals.debt_id = d.id
```

---

## 4. Mappers

| Guideline | Detail |
|-----------|--------|
| **Skip payment mapping on lists** | `toDebtCardView(debtSummary)` leaves `payments` empty. Map payments only in detail views. |
| **One `now` per batch** | Hook `queryFn`s create a single `Date` and pass it to all mappers in the batch. |
| **Formatted strings at boundary** | Store ISO in DB; use `formatDueDate`, `formatRelativeTime`, etc. at map-to-view time only. |

---

## 5. React Query

| Guideline | Detail |
|-----------|--------|
| **`staleTime: Infinity`** | Local SQLite data is authoritative until a mutation changes it. Set on `useDebts`, `useActivities`, `useDebt`, and matching `prefetchQuery` calls. |
| **Shared `queryFn`** | Export `load*` functions from hooks. `_layout.tsx` prefetch must use the **same** function as the hook. |
| **Invalidate on mutation only** | Mutations (`useAddDebt`, `useRecordPayment`, seed hook, etc.) call `invalidateQueries`. Do not lower `staleTime` to refresh lists. |
| **Prefetch new tab queries** | If a new root tab loads a large query, add it to the `_layout.tsx` init `Promise.all`. |

---

## 6. Lists & screens

| Guideline | Detail |
|-----------|--------|
| **FlashList for long lists** | Use `DebtList`, `ActivityList`, or `FlashList` directly. Do not use `ScrollView` + `.map()` for unbounded debt or activity feeds. |
| **Memo list items** | `DebtCard` and activity rows use `React.memo`. Keep props stable where possible (`onPress` by id). |
| **Single-pass derivations** | Bucket, filter, and count in `debt-list-utils.ts` with one loop. Add new derivations there, not as chained `.filter()` in screens. |
| **`useMemo` filtered data** | Debts tab content: `useMemo(() => sortDebts(filterDebts(debts, filter)), [debts, filter])`. |
| **Scroll to top on filter change** | When a filter or tab changes the list, call `listRef.current?.scrollToTop()` (see `DebtsScreen`). |
| **Forward refs through list wrappers** | `DebtList` uses `forwardRef<FlashListRef>` so parents can imperatively scroll. |

### Avoid

- Loading all `PaymentsRow` objects for list queries
- Mapping `payments[]` in `toDebtCardView` for every debt on list screens
- `ScrollView` rendering large numbers of `DebtCard` components
- Multiple `.filter()` / `.reduce()` passes over the same array in render
- `new Date()` inside every row mapper in a loop (use a batch `now`)
- `staleTime: 0` or `30_000` on local list queries without a strong reason
- Duplicating `queryFn` between hooks and prefetch
- Loading full `DebtWithRelations` when `DebtSummary` is sufficient

---

## 7. File map

| Path | Role |
|------|------|
| `src/features/debts/repositories/debt-repository.ts` | `listSummaries()`, `getById()` |
| `src/features/debts/hooks/use-debts.ts` | `loadDebts` — shared queryFn + view mapping |
| `src/lib/db/mappers.ts` | `DebtSummary` vs `DebtWithRelations` |
| `src/features/debts/lib/debt-list-utils.ts` | `bucketHomeDebts`, `filterDebts`, `computeDebtTabCounts` |
| `src/features/debts/lib/mappers.ts` | `toDebtCardView`, `toDebtDetailView` |
| `src/components/debts/debt-list.tsx` | Virtualized debt list |
| `src/components/activity/activity-list.tsx` | Virtualized activity list |
| `src/app/_layout.tsx` | DB init + query prefetch gate |

---

## 8. Adding a new list screen

1. **Repository** — Summary or aggregate query returning domain shapes.
2. **Hook** — `load*` queryFn: read repository, map to view with batch `now`; `useQuery` with `staleTime: Infinity`.
3. **UI** — `FlashList` (or reuse `DebtList` / `ActivityList`).
4. **Derivations** — Single-pass utils + `useMemo`; no filter chains in JSX.
5. **Mutations** — `invalidateQueries` for the new key.
6. **Launch** — Prefetch in `_layout.tsx` if the screen is on a root tab or critical path.
7. **Verify** — Seed sample data; scroll and tab-switch under load.

---

## 9. Adding a new field to debt cards

1. Add column or join in `DEBT_SUMMARY_SELECT` if the field appears on **all** list cards.
2. Extend `DebtSummary` + `toDebtSummary` — not `DebtWithRelations` alone.
3. Map in `toDebtCardView`.
4. Do not load payments unless the card displays payment data.

---

## 10. Future improvements

Optional next steps — not substitutes for the guidelines above:

- **Pagination / `LIMIT`** for the activity feed at very large event counts
- **SQLite indexes** when new filter or sort columns are added
- **Selective cache updates** instead of full list refetch after mutations
- **Skeleton UI** instead of `return null` while `isPending` on first load

---

## 11. Verification checklist

1. Dev build → Settings → Developer → **Seed sample data**
2. **Home** — loads quickly; scroll through sectioned debts smoothly
3. **Debts** — switch All / Active / Overdue / Paid; list jumps to top; no lag
4. **Activity** — scroll hundreds of rows smoothly
5. **Debt detail** — payment history is correct
6. **Add debt / record payment** — lists update correctly

Compare changes against §3–§6 before merging list or data-layer work.
