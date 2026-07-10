# PRD: Debt Management Actions

**Status:** Draft  
**Scope:** Edit debt, archive debt, and contextual record-payment actions  
**Related:** [design-brief.md](./design-brief.md), [performance.md](./performance.md), [reminders-prd.md](./reminders-prd.md), [reminders-grouping-prd.md](./reminders-grouping-prd.md), [people-prd.md](./people-prd.md)

## 1. Summary

Users need a clean way to correct debt details after creation and remove debts they no longer want in active views. v1 introduces debt management actions without scattering edit buttons across the app:

- Edit debt terms: amount, due/promised date, reason, and reminder on/off.
- Archive debt: remove from active lists, totals, reminders, and person rollups while preserving payment history.
- Record payment from contextual action menus, opening the payment form in the current screen context.

The interaction model is intentionally quiet:

- Debt Detail is the canonical action surface via a header overflow menu.
- Debt rows expose power actions via long press.
- iOS uses platform-native menus through Expo UI where available.
- Android uses a compact action-sheet fallback for action selection.
- Edit uses modal presentation consistent with `edit-person`.
- Record payment uses a shared bottom-sheet form that opens over the current screen context.

Permanent delete is out of scope for v1.

## 2. Goals

| Goal | Description |
|------|-------------|
| Correct common mistakes | Users can fix amount, due date, reason, and reminder settings without recreating a debt. |
| Preserve ledger trust | Payment history remains valid; edits cannot create impossible balances. |
| Keep primary UI uncluttered | No inline edit/archive buttons on every debt row or summary card. |
| Support fast power actions | Long-press row actions make frequent management tasks quick. |
| Respect platform conventions | Native menus on iOS; compact fallback on Android; native archive confirmation alerts. |
| Keep active views accurate | Archived debts leave Home, Debts, People totals, reminder eligibility, and active debt lists. |

## 3. Non-Goals

- Permanent delete.
- Editing debt direction.
- Editing the person attached to a debt.
- Editing created/added date.
- Full archived-debts browsing or restore flows.
- Overpayment support for paid debts.
- Reworking Activity into a full audit-log surface.

## 4. Product Decisions

| Decision | v1 Requirement |
|----------|----------------|
| Delete vs archive | Ship **Archive** only. Archive is user-facing removal from active surfaces, not hard deletion. |
| Edit fields | Amount, due/promised date, reason, reminder on/off. |
| Immutable fields | Person, direction, created/added date, currency. |
| Paid debts | Editable, but reminder controls are hidden/disabled. Raising amount above total paid reopens the debt as partial. |
| Amount validation | New original amount must be `>= totalPaid`. |
| Action discovery | Header overflow menu on Debt Detail plus row long-press menu. |
| Row long-press actions | Active/partial/overdue/due-soon: Record payment, Edit debt, Archive debt. Paid: Edit debt, Archive debt. |
| Confirmation | Archive uses native `Alert`, not a custom sheet. |
| Alert destructive label | `Archive`. |
| Archive feedback | After success, show toast `Debt archived.` |
| Detail status badge | Remove status badge from header action area; render it inside the summary card, top-right. |

## 5. UX Requirements

### 5.1 Debt Detail

Debt Detail remains the canonical place to understand and manage one debt.

Header:

- Title remains the person's name.
- Header right becomes a platform menu trigger, not the status badge.
- Menu actions:
  - `Record payment` when remaining amount is greater than `0`.
  - `Edit debt`.
  - `Archive debt`.

Summary card:

- Shows the debt status badge in the card's top-right corner.
- Keeps amount remaining, original amount, due/promised date, added date, and progress.
- For paid debts, status badge still appears in the summary card rather than the header.

Primary payment CTA:

- The existing `Add payment` CTA should use the shared record-payment sheet.
- It should open over the current detail screen rather than navigating to a separate route.

### 5.2 Debt Row Long Press

Debt rows in Home, Debts, and Person Detail support long-press actions.

iOS:

- Use Expo UI's SwiftUI `ContextMenu` for row long-press menus.
- Use Expo UI's SwiftUI `Menu` for single-tap header overflow menus.
- Reference docs: `https://docs.expo.dev/versions/v56.0.0/sdk/ui/swift-ui/contextmenu/`

Android:

- Use a compact app-styled action sheet as the fallback.
- This sheet is a menu fallback, not a form-style bottom sheet.
- It should show only the valid actions for the selected debt.

Shared behavior:

- Normal tap opens Debt Detail.
- Long press opens actions without navigating.
- `Record payment` opens the payment form from the current screen context.
- `Edit debt` opens the edit modal.
- `Archive debt` opens native confirmation.

### 5.3 Edit Debt Modal

Edit Debt uses the same modal presentation approach as Edit Person:

- `presentation: "modal"`.
- `animation: "slide_from_bottom"`.
- Header title: `Edit debt`.
- Header save action: `Save`.

Fields:

| Field | Behavior |
|-------|----------|
| Amount | Number input initialized with original amount. |
| Due date | Same date picker language as Add Debt. This is the promised/due date only. |
| Reason | Optional text input. |
| Reminder | Toggle for unpaid debts only. Hidden or disabled for paid debts. |

Do not show editable person or direction controls.

Amount helper text:

- If there are existing payments, show a live preview:
  - `{paidAmount} already paid · {remainingAfterSave} remaining after save`
- If amount is less than total paid, show an error:
  - `Amount can't be less than {paidAmount} already paid`
- Save is disabled while this error exists.

Paid-debt behavior:

- Editing amount to exactly total paid keeps the debt paid.
- Editing amount above total paid makes the debt partially paid with the derived remaining balance.
- Editing amount below total paid is blocked.
- Reminder controls do not appear for paid debts unless the edited amount reopens the debt and the form design explicitly accounts for that transition.

### 5.4 Archive Confirmation

Archive confirmation uses native alerts.

Active/partial/overdue/due-soon copy:

- Title: `Archive this debt?`
- Body: `It will be removed from your active lists and totals. Payment history will be kept.`
- Cancel action: `Cancel`
- Destructive action: `Archive`

Paid copy:

- Title: `Archive this debt?`
- Body: `It will be removed from your lists. Payment history will be kept.`
- Cancel action: `Cancel`
- Destructive action: `Archive`

After success:

- From Debt Detail: return to the previous screen and show `Debt archived.`
- From row long press: remove the row in place and show `Debt archived.`

No Undo in v1.

## 6. Data & Domain Requirements

### 6.1 Edit Debt

Add a repository mutation that updates only editable debt fields:

- `original_amount`
- `due_date`
- `reason`
- `reminder_enabled`
- `reminder_time`
- `updated_at`

Validation:

- Load or compute total paid for the debt inside the mutation transaction.
- Reject `original_amount < totalPaid`.
- Reject updates for missing debt IDs.
- Do not mutate `person_id`, `direction`, `currency`, `created_at`, or `lent_date`.

Reminder lifecycle:

- If reminder remains enabled and the due date changes, reminder sync should reschedule using the existing reminder rules.
- If reminder is turned off, scheduled reminders for that debt should be cancelled by the normal reminder sync path.
- Paid debts should not schedule reminders.

### 6.2 Archive Debt

Add a repository mutation that sets:

- `archived_at = now`
- `updated_at = now`

Archive effects:

- Debt is excluded from existing `listSummaries()` and `listSummariesForPerson()` paths.
- Debt is excluded from Home, Debts, People totals, and reminder eligibility.
- Payment history remains stored.
- Activity rows remain stored.
- Reminder sync cancels scheduled reminders for archived debts.

### 6.3 Activity

Activity should preserve trust without becoming noisy.

Required:

- Create an activity event when a debt is archived.
- Create an activity event for amount changes.
- Create an activity event for due date changes.

Optional/deferred:

- Reason-only edits do not need activity in v1.
- Reminder-only edits do not need activity in v1.

Implementation note:

- Current `ActivityEventType` only supports `debt_created`, `payment_recorded`, and `debt_paid`.
- Add new event types or an equivalent metadata strategy intentionally; do not overload payment events.
- Activity copy should be factual and concise, for example:
  - `Amount changed from KES 3,000 to KES 2,500`
  - `Due date changed from Jul 12 to Jul 20`
  - `Debt archived`

## 7. Query, Cache, And Performance Requirements

Follow [performance.md](./performance.md).

List surfaces:

- Continue using `debtRepository.listSummaries()` / `DebtSummary`.
- Do not load payment arrays on list paths for long-press action eligibility.
- `Record payment` availability should use `DebtSummary.remainingAmount` / mapped `DebtCardView.remaining`.
- Long lists continue using `FlashList`.

Detail and form surfaces:

- Edit Debt may use `getById()` because it is a single-debt form and needs payment totals for validation.
- Record Payment may use `getById()` because it is a single-debt form.

React Query:

- New hooks use `staleTime: Infinity` where applicable.
- Mutations call the shared `afterDebtDomainChange(queryClient, { debtId })`.
- Invalidate debt lists, debt detail, activity, people rollups, and reminder-related state through the existing shared invalidation/sync pipeline.

## 8. Navigation & Component Plan

New or changed routes:

| Route | Purpose |
|-------|---------|
| `/edit-debt?debtId=...` | Modal edit form. |

New or changed components:

| Component | Purpose |
|-----------|---------|
| `DebtActionsMenu` | Shared platform-switching action menu for row and detail contexts. |
| `DebtActionsMenu.ios` | Uses Expo UI SwiftUI `ContextMenu` / `Menu`. |
| `DebtActionsMenu.android` | Compact action-sheet fallback. |
| `EditDebtScreen` | Modal form for editable debt terms. |
| `RecordPaymentSheet` | Shared bottom-sheet payment form opened in the current screen context. |
| `DebtCard` | Add long-press support while preserving normal press behavior. |
| `DebtDetailScreen` | Move status badge into summary card; add header overflow action menu. |

Implementation should keep menu actions data-driven:

```ts
type DebtAction = "record-payment" | "edit-debt" | "archive-debt";
```

Paid debts omit `record-payment`.

## 9. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Partial debt, amount lowered above paid total | Remaining recalculates and status updates from derived values. |
| Partial debt, amount lowered below paid total | Block save with helper error. |
| Paid debt, amount raised | Debt becomes partial/active with remaining balance. |
| Paid debt, amount equals total paid | Debt remains paid. |
| Paid debt, amount lowered below paid total | Block save. |
| Due date changed with reminders enabled | Reminder sync reschedules. |
| Due date changed into the past | Use existing reminder eligibility rules; do not create stale scheduled reminders. |
| Debt archived with scheduled reminder | Reminder sync cancels it. |
| User archives from detail | Navigate back and toast. |
| User archives from list | Row disappears after cache invalidation and toast. |
| Debt disappears before action completes | Show graceful failure toast. |

## 10. Acceptance Criteria

- Debt Detail header no longer shows the status badge as the header-right action.
- Debt Detail summary card shows the status badge in the top-right.
- Debt Detail header menu exposes valid actions for the debt state.
- Long pressing an unpaid debt row exposes Record payment, Edit debt, Archive debt.
- Long pressing a paid debt row exposes Edit debt and Archive debt only.
- iOS row and header menus use Expo UI native menu primitives where supported.
- Android uses a compact action-sheet fallback for action selection.
- Record payment opens from the current context and updates the current list/detail after save.
- Record payment does not require navigating to a separate payment route from row/detail actions.
- Edit Debt modal opens from detail and row actions.
- Edit Debt can update amount, due/promised date, reason, and unpaid reminder settings.
- Edit Debt cannot change person, direction, created/added date, or currency.
- Edit Debt blocks amount below total paid.
- Raising a paid debt's amount above total paid reopens it as partially paid.
- Archive requires native alert confirmation.
- Archive removes debt from active lists/totals and preserves payment history.
- Archive cancels scheduled reminders through reminder sync.
- Archive creates an activity event.
- Amount and due-date edits create activity events.
- Mutations invalidate shared debt/activity/people/detail caches via the existing pipeline.
- List screens continue using summary queries and `FlashList`.

## 11. Suggested Delivery Plan

1. Data layer
   - Add repository methods for edit and archive.
   - Add activity event support for debt edited/archived cases.
   - Ensure reminder sync and query invalidation run after mutations.

2. Edit Debt modal
   - Add route and screen.
   - Reuse Add Debt form controls where sensible.
   - Add paid-total validation and remaining preview.

3. Record Payment presentation
   - Extract the existing payment form into a shared sheet component.
   - Wire detail CTA and contextual actions to open the sheet over the current screen.

4. Action menus
   - Build shared platform-switching action menu.
   - Wire Debt Detail header and debt rows.
   - Keep Android fallback compact.

5. Archive UX
   - Add native alert confirmation.
   - Navigate/toast correctly from detail and list contexts.

6. Detail polish
   - Move status badge into summary card.
   - Remove status from header-right.

7. Verification
   - Seed sample data in Settings -> Developer.
   - Test active, partial, paid, overdue, and reminder-enabled debts.
   - Verify Home, Debts, People, Person Detail, Activity, and reminder inbox behavior after edits/archive.

## 12. Open Implementation Notes

- Expo UI native menus may require small platform-specific wrappers. Keep the public app component stable even if internals differ by platform.
- If iOS Expo UI menu support has constraints inside list rows, preserve the product behavior with the closest native-feeling fallback and document the constraint in the PR.
- Activity copy may require extending activity view mappers beyond amount-only event rendering.
