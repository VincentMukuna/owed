# PRD: Bi-Directional Debts

## 1. Summary

Owed should support both sides of an informal money promise:

- Money someone owes the user.
- Money the user owes someone else.

This must not become a separate borrowing module. A debt/promise remains one record with one person, one amount, one due date, one payment history, and one direction.

The updated product mental model:

> Keep track of money between you and others.

## 2. Product Principles

- Default experience is unified across both directions.
- Direction is a property of a promise, not a new tab, module, or workflow.
- Do not introduce netting, settlement logic, borrowing reports, interest, contracts, payment integrations, group debts, or accounting concepts.
- Use calm copy: promise, owed to you, you owe, unsettled, settled.
- Avoid aggressive copy: debtor, collect, chase, borrower, lender, debt collection.
- Existing user data must preserve current behavior.

## 3. Decisions From Grilling

| Area | Decision |
|------|----------|
| Persistence | Add a required `debts.direction` field. Existing rows migrate to `they_owe_me`. |
| Direction values | `they_owe_me` and `i_owe_them`. |
| Queries | Keep one prefetched `useDebts()` list for non-archived summaries. Filter/bucket locally in single-pass utilities. |
| Home default | Unified mixed-direction dashboard by default. No direction toggle as the primary Home mode. |
| Debts default | Unified mixed-direction list by default. Direction and status are separate filters. |
| People | Show directional balances explicitly. Do not make net the primary UI. |
| Activity | Keep activity event schema unchanged; join debt direction and render direction-aware copy. |
| Reminders | Same reminder behavior for both directions; wording changes by direction. |
| Debt cards | Show direction badge only in mixed-direction contexts. |
| Direction editing | Out of scope for MVP. Direction is chosen at creation and not editable. |
| Net balance | Out of scope for MVP. A quiet secondary net line may appear on Person detail only if both directions exist, but no net workflow. |

## 4. Data Model

Add a migration:

```sql
ALTER TABLE debts
ADD COLUMN direction TEXT NOT NULL DEFAULT 'they_owe_me';

CREATE INDEX idx_debts_direction ON debts(direction);
```

If Expo SQLite supports it cleanly for this migration shape, prefer a check constraint for new table definitions and future schema documentation:

```sql
CHECK (direction IN ('they_owe_me', 'i_owe_them'))
```

TypeScript contract:

```ts
export type DebtDirection = "they_owe_me" | "i_owe_them";
```

Add `direction` to:

- `DebtsRow`
- `DebtSummary`
- `DebtWithRelations`
- `DebtCardView`
- `DebtDetailView`
- `CreateDebtInput`
- activity relation rows

Mapper code should validate unknown direction strings and fail loudly in development rather than silently defaulting.

## 5. Performance Contract

Follow [performance.md](./performance.md).

- List screens keep using `debtRepository.listSummaries()` and `DebtSummary`.
- Detail screens keep using `debtRepository.getById()`.
- Do not load payment arrays for list cards.
- Add direction-aware derivations to `debt-list-utils.ts` with single-pass loops.
- Keep `useDebts()` as the one warm list cache with `staleTime: Infinity`.
- Add SQL direction filters only for aggregate queries that need them, such as payment totals.

Recommended utility shapes:

```ts
type DebtDirectionFilter = "all" | DebtDirection;
type DebtStatusFilter = "all" | "active" | "overdue" | "paid" | "due-soon";

type DebtListFilters = {
  direction: DebtDirectionFilter;
  status: DebtStatusFilter;
  searchQuery: string;
};
```

## 6. Add Promise Flow

Add a `Direction` segmented control at the top of the add screen:

```txt
Direction
[They owe me] [I owe them]
```

Default: `They owe me`.

Direction-aware person copy:

- `they_owe_me`: `Who owes you?`
- `i_owe_them`: `Who do you owe?`

Save payload must include direction explicitly.

Copy updates:

- Toast: `Promise saved.`
- CTA can remain `Save`.
- The tab can remain `Debts`, but form copy should lean toward `promise` where natural.

## 7. Home

Home defaults to a unified view of both directions.

Header copy:

```txt
Here's what's unsettled
```

Top summary should show two directional totals, with no net balance:

```txt
Owed to you     KES 12,400
You owe         KES 3,100
```

Each directional total may open Debts prefiltered to that direction.

Stat cards become cross-direction operational stats:

| Card | Meaning |
|------|---------|
| Active promises | Active unpaid promises across both directions. |
| Overdue | Overdue promises across both directions. |
| Due soon | Due-soon promises across both directions. |
| Settled this month | Payments recorded this month across both directions. |

Debt sections remain familiar but unified:

- Due soon
- Overdue
- Active

Because Home is mixed-direction by default, debt rows in these sections should show the direction badge.

Empty state:

- Title: `Nothing unsettled yet.`
- Body: `Add a promise to remember money between you and someone else.`
- CTA: `Add promise`

## 8. Debts

Debts defaults to all directions and all statuses.

Use two filter rows:

```txt
Direction
[All] [Owed to you] [You owe]

Status
[All] [Active] [Overdue] [Paid]
```

`due-soon` can remain a route/internal filter for Home and reminder focus, but does not need to be a visible Debts tab unless the current design already exposes it.

Debt row direction badges:

- Show badges when direction filter is `All`.
- Hide badges when direction filter is `Owed to you` or `You owe`.

Badge labels:

- `OWED TO YOU`
- `YOU OWE`

Keep badges compact: dot + uppercase label, not a heavy pill.

Empty states:

- Mixed: `Nothing unsettled yet.` / `Add a promise to remember money between you and someone else.`
- Owed to you: `Nothing owed to you.` / `Money people owe you will appear here.`
- You owe: `Nothing you owe.` / `Money you need to pay back will appear here.`

## 9. People

People must show both directional balances explicitly. Do not use net as the primary list value.

List row target:

```txt
Larry Douglas
Owes you KES 1,315 · You owe KES 400
```

If only one direction exists, show only that side.

Person aggregate fields should include:

- `owedToYou`
- `youOwe`
- `owedToYouOpenCount`
- `youOweOpenCount`
- directional overdue counts
- directional due-soon counts
- paid/settled counts
- last activity

Person detail should split active promises by direction:

```txt
OWED TO YOU
- Dinner split
- Uber ride

YOU OWE
- Lunch
- Emergency

SETTLED
- Paid records from either direction
```

Hide empty directional sections or show quiet empty states:

- `Larry does not owe you anything active.`
- `Nothing you owe Larry.`

A secondary net line may appear on Person detail only when both directions exist, but it must not drive actions or settlement.

## 10. Debt Detail

Summary behavior remains structurally the same, but copy changes by direction.

For `they_owe_me`:

- Summary label: `Amount remaining`
- Payment history row: `KES 300 paid`
- Follow-up section title: `Follow-up message`
- Copyable message remains appropriate:
  - `Hey Simon, just a reminder about the KES 150 you said you'd send on Thu, 3 Apr.`
- Paid copy:
  - `Simon has fully paid this amount.`

For `i_owe_them`:

- Summary label: `Amount remaining`
- Payment history row can remain `KES 300 paid`, or use `You paid KES 300` where space allows.
- Replace follow-up with a reminder-style section:
  - Title: `Payment reminder`
  - Body: `You owe Simon KES 150 for Movie night.`
- Do not add a copy-message action for `i_owe_them` in MVP unless implementation finds a natural fit.
- Paid copy:
  - `You fully paid this amount to Simon.`

CTA remains:

```txt
Add payment
```

## 11. Payments

The action is still recording progress toward settlement.

Direction-aware copy:

| Direction | Event meaning | Activity copy |
|-----------|---------------|---------------|
| `they_owe_me` | Person paid user | `John paid KES 300` |
| `i_owe_them` | User paid person | `You paid John KES 300` |

`Paid this month` / `Settled this month` means all payments recorded this month across both directions unless a screen is explicitly direction-filtered.

Add or update repository aggregate:

```ts
sumPaymentsInMonth(input?: { direction?: DebtDirection }): Promise<number>
```

## 12. Activity

Keep `activity_events` unchanged for MVP.

Update activity list queries to join debt direction:

```sql
d.direction AS debt_direction
```

Direction-aware activity copy:

| Event | `they_owe_me` | `i_owe_them` |
|-------|---------------|--------------|
| `debt_created` | `You added KES 3,000 owed by John` | `You added KES 3,000 you owe John` |
| `payment_recorded` | `John paid KES 300` | `You paid John KES 300` |
| `debt_paid` | `John's debt was marked as paid` | `Your debt to John was marked as paid` |

Tradeoff: if direction editing is added later, historical activity text would change. MVP avoids this by making direction immutable.

## 13. Reminders And Notifications

Reminder eligibility remains:

- Reminder enabled.
- Debt not archived.
- Remaining amount greater than zero.

Same scheduling rules apply to both directions.

Notification copy should change by direction:

For `they_owe_me`:

- Due: `John promised to pay KES 500 today.`
- Overdue: `John was due yesterday, KES 500 still outstanding.`

For `i_owe_them`:

- Due: `You owe John KES 500 today.`
- Overdue: `You were due yesterday, KES 500 still owed to John.`

Collapsed reminder notifications need a product pass during implementation. Prefer neutral copy when the bucket mixes directions:

- `6 promises need attention today.`
- `KES 4,200 unsettled today.`

Avoid collapsed copy that implies all promises are owed to the user.

## 14. Implementation Plan

### Phase 1: Data And Types

- Read Expo SDK 56 docs before code changes, per repo instruction.
- Add migration `005-debt-direction`.
- Extend row/domain/view-model types.
- Add mapper validation.
- Add direction to debt create flow and repository insert.
- Ensure existing rows become `they_owe_me`.

### Phase 2: List Utilities And Queries

- Extend `debt-list-utils.ts` for direction filters and mixed Home buckets.
- Keep one `useDebts()` query.
- Add direction-aware `sumPaymentsInMonth`.
- Add person directional aggregate SQL.
- Add activity direction join.

### Phase 3: Add Flow

- Add direction segmented control.
- Update person placeholder copy.
- Update save toast.
- Preserve prefilled person behavior from Person detail.

### Phase 4: Home And Debts

- Replace old Home hero with two directional totals.
- Update stat cards.
- Show direction badges in mixed Home rows.
- Add Debts direction filter row.
- Keep status filter row.
- Scroll lists to top when either filter changes.

### Phase 5: People And Details

- Update People list directional summaries.
- Split Person detail active sections by direction.
- Update Debt detail direction-aware copy.
- Update payment history wording where useful.

### Phase 6: Activity, Reminders, Seeds

- Update activity copy.
- Update notification builders for direction.
- Update dev seed data to include both directions.
- Verify with Settings -> Developer -> Seed sample data.

## 15. Acceptance Criteria

- Existing user debts appear as `Owed to you` after migration.
- Add Promise defaults to `They owe me` and can save `I owe them`.
- Home shows both directional totals by default and no net balance.
- Home stats count both directions.
- Debts defaults to all directions and all statuses.
- Debts can filter `You owe + Overdue`.
- Mixed lists show direction badges; direction-filtered lists do not.
- People rows show both `Owes you` and `You owe` balances where applicable.
- Person detail splits active debts into `Owed to you` and `You owe`.
- Activity copy is unambiguous for both directions.
- Reminders fire for both directions with correct private wording.
- No list path loads payment arrays.
- Seeded hundreds-row data remains smooth on Home, Debts, People, and Activity.

## 16. Out Of Scope

- Editing direction after creation.
- Net balance dashboard.
- Net settlement workflow.
- Borrowing tab or separate borrowing module.
- Reports, charts, interest, contracts, group debts, splitting, payment integrations, credit scoring.
- Automatic messaging.

