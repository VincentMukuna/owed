# PRD: Reminder Grouping & Hardening (v0.4)

**Status:** Approved — ready for implementation
**Baseline:** v0.3 reminder layer shipped (see [reminders-prd.md](./reminders-prd.md))
**Depends on:** SQLite (`debts`, `payments`, `reminders`), `expo-notifications` (~56.0.18, plugin in `app.json`)

This document captures the frozen design decisions for the **second revision** of the reminder layer. It addresses correctness bugs, permission UX, and scale problems found in the v0.3 implementation, and introduces **grouped (collapsed) notifications** so heavy days don't spam the user. Written for an implementing agent without prior chat context.

**Related docs**

| Document | Role |
|----------|------|
| [reminders-prd.md](./reminders-prd.md) | v0.3 reminder layer — the baseline this revises |
| [prd.md](./prd.md) | Original product vision |
| [persistence-prd.md](./persistence-prd.md) | SQLite + React Query patterns |
| [performance.md](./performance.md) | List/query performance rules — apply to the sync engine |
| [design-brief.md](./design-brief.md) | Visual tone — calm, private, human |

**Expo version:** SDK 56 — read [Expo Notifications docs](https://docs.expo.dev/versions/v56.0.0/sdk/notifications/) before implementing.

---

## 1. Summary

v0.3 schedules **one OS notification per reminder**, bakes notification copy at schedule time, requests notification permission immediately on the onboarding screen, and reconciles via an unguarded per-debt loop on every foreground. Review surfaced nine issues. This revision fixes them in two tiers:

- **Tier 1 — correctness + UX:** stale push amount after partial payment (#1), reconcile race / no error handling (#3), no feedback when a reminder is enabled but permission is denied (#8), and granting permission not attaching pending notifications (#9). Plus removing the premature onboarding permission prompt (#7).
- **Tier 2 — scale + noise:** grouped/collapsed notifications (#4), an O(N)-on-every-foreground sync engine (#5), and an unbounded inbox (#6).

The unifying change is a **single, serialized, SQL-driven sync engine** (`runReminderSync()`) that everything calls, plus a **bucketed scheduling model** with a rolling OS-notification window.

### Hard product constraints (do not violate)

- **Exactly one `overdue` reminder per debt, ever** — fired the day after the due date. No recurring overdue nudges.
- **Single app currency** (`KES`, from `APP_CONFIG.defaultCurrency`). No currency switcher yet. Design must be forward-compatible with a future per-currency dimension.
- **Per-debt `reminder_time` column stays untouched** — reserved for a future "remind at a specific time per debt" release. Scheduling continues to use the global `defaultReminderTime`.

---

## 2. Scope

### In scope
- Tier 1 fixes: #1, #3, #7, #8, #9.
- Tier 2: #4 (grouped notifications + rolling window), #5 (batched SQL sync), #6 (inbox retention via soft-marking).
- New migration `004` adding `group_key` and `archived_at` to `reminders`.

### Out of scope
- Per-debt reminder time (future release; column preserved, not wired).
- Multi-currency (future; bucket key designed to extend cleanly).
- Recurring/escalating overdue reminders.
- Hard-deleting any reminder rows.
- Editing a debt's due date (no edit-debt feature exists today).

---

## 3. Frozen decisions

The numbering matches the grilling session that produced this PRD.

### D1 — Bucketed scheduling model (replaces per-debt OS notifications)
- The **scheduling unit** is a **bucket** keyed by `(type, bucketDate)`.
  - For `due`: `bucketDate` = the debt's `due_date`.
  - For `overdue`: the OS notification fires at `due_date + 1 day`, but the bucket's **`bucketDate` is still the debt's `due_date`** (so notification routing/filtering always uses the original due date; see D4).
- **DB rows stay per-debt.** Grouping is purely at the OS-push level. Each debt still has its own `reminders` row(s), so the in-app inbox and existing dedup logic are unchanged.
- Forward-compat: when multi-currency lands, the bucket key becomes `(type, bucketDate, currency)`. Today currency is constant, so it's omitted from the key.

### D2 — Collapse threshold and copy
- A bucket with **≤ 5 eligible debts** → schedule **one OS notification per debt** (current behavior, current copy, tap → debt detail).
- A bucket with **≥ 6 eligible debts** → schedule **one collapsed OS notification** for the whole bucket.
- Collapsed copy shows **2 names + remainder + summed total**, names ordered by **remaining amount descending** (ties broken alphabetically):
  - Due: `"{A}, {B}, and {N} more promised you {CUR} {total} today"`
  - Overdue: `"{A}, {B}, and {N} more were due yesterday — {CUR} {total} still owed"`
  - `{total}` = `SUM(remaining)` across the bucket in the single app currency.

### D3 — Inbox stays per-debt
- The collapse is **only** the OS push. When a bucket fires, each debt's reminder row is still individually marked `sent`, so the inbox renders one row per person exactly as today. No grouped inbox rows.

### D4 — Collapsed notification tap target (filter by date, not frozen IDs)
- Collapsed push `data` carries `{ kind: "group", reminderType: "due" | "overdue", focusDate: <debt due_date YYYY-MM-DD> }`.
- Tapping deep-links to the Debts tab: `/(tabs)/debts?focusDate=YYYY-MM-DD&focusType=due|overdue`.
- `DebtsScreen` reads these params and shows a **transient focused view**: only debts in that bucket **that are still unpaid**, with a dismissible banner at the top, e.g. *"Showing 6 people who promised you today · Clear"* (copy varies by `focusType`).
  - Clearing the banner, or switching the existing tab filter, drops back to the normal view.
- **Why date params, not a frozen debt-ID list:** the live query naturally reflects debts paid between fire time and tap time (no stale/overcounted entries). Self-describing and short. Safe because due dates can't be edited today.
- **Individual (≤5) notification tap is unchanged** → opens that debt's detail.

### D5 — Persistence of grouping (migration 004)
- Add nullable **`group_key TEXT`** to `reminders`: `"{type}:{bucketDate}"` for reminders in a collapsed bucket, `NULL` for individually-scheduled ones.
- For a collapsed bucket, schedule **one** OS notification and store its `notification_id` on **every** reminder row in the bucket (same id repeated). Cancellation cancels each **distinct** `notification_id` once (use a `Set`).
- This makes "is this bucket collapsed?", "which rows fire together?", and "cancel/replace this bucket" answerable directly from SQL.

### D6 — iOS 64-notification cap: rolling window
- iOS hard-caps an app at **64 pending local notifications** and silently drops the excess.
- Register OS notifications only for the **soonest ~50 buckets** by `remind_at` (headroom under 64).
- Every `runReminderSync()` re-evaluates and **tops up**: as near buckets fire and drop off, the next-furthest buckets get scheduled.
- Reminders beyond the window stay `scheduled` in the DB with `notification_id = NULL`; they receive an OS notification once they enter the window. The inbox is unaffected.
- Accepted edge: a user who creates many far-future debts and never reopens the app won't get pushes past the window; reconcile-on-foreground covers any real usage and the inbox backfills.

### D7 — Inbox retention via soft-marking (never delete; migration 004)
- Add nullable **`archived_at TEXT`** to `reminders`.
- During `runReminderSync()`, set `archived_at` on `sent`/`cancelled` reminders **older than 90 days**. **Never hard-delete any row.**
- `listInbox()` and `countUnread()` filter to `archived_at IS NULL`.
- Single rule: **mark archived after 90 days; inbox shows unmarked rows only.**

### D8 — Permission prompt on the "Remind me" toggle (#8) + remove onboarding prompt (#7)
- **Remove the onboarding permission prompt entirely.** The first prompt happens on real intent (the toggle), not on first launch.
- When the add-debt "Remind me" toggle is switched **on**, check the live OS permission state:
  - `allowed` → enable, no prompt.
  - `not-asked` → show the priming explainer alert, then the OS prompt. **Drop the `notificationsPermissionAsked` gate on this path** so it always primes on intent.
  - `off` (denied / can't ask again) → **still enable the reminder**, and show an inline hint under the toggle: *"Notifications are off — you'll see reminders in the app. Turn on in Settings."* with tap-through to OS settings. No blocking alert / no nagging.
- The toggle always turns on and the reminder is created regardless of permission; the prompt only governs whether the user **also** gets OS pushes (the in-app inbox always works).

### D9 — Single serialized sync engine (#3, #1, #9)
- Introduce one entry point: **`runReminderSync()`**.
  - Steps: mark missed (scheduled & past → `sent`) → archive old (D7) → cancel ineligible → compute desired buckets (D11) → diff & write `reminders`/`group_key` → window + top-up OS notifications (D6) → invalidate `reminderKeys.all`.
  - Wrapped in **try/catch** (no unhandled rejections).
- **In-memory promise mutex:** if a run is in flight, the next caller **chains** after it (await current, then run exactly one more) instead of running concurrently. A mutation landing mid-run triggers exactly one follow-up rebuild.
- **All triggers call `runReminderSync()`:** app start, `AppState → active`, `useAddDebt`, `useRecordPayment` (**both partial and full payments**), settings reminder-time change, settings overdue toggle, and **permission granted** (from the toggle flow or the Settings "Notifications" row — this resolves #9).
- The bespoke `syncRemindersForDebt`, `rescheduleAllEligibleReminders`, and direct `reconcileReminders` calls collapse into this one function.
- Because rebuilds are always whole-bucket and idempotent, the `UNIQUE(debt_id, type) WHERE status='scheduled'` interleaving violation disappears.

### D10 — #1 stale amount: re-sync on every payment
- A partial payment changes a debt's `remaining`, which affects both an individual notification's copy and a collapsed bucket's total/names.
- Therefore **`useRecordPayment` calls `runReminderSync()` for all payments**, not just full payoffs. Full payoff still removes the debt from eligible buckets (remaining ≤ 0); partial payment rebuilds the affected bucket(s) with fresh amounts.

### D11 — #5 performance: SQL-grouped desired state + diff
- Compute the entire desired bucket state in **SQL**, not a per-debt JS loop.
- One grouped query over eligible debts (`reminder_enabled = 1`, `archived_at IS NULL` on the debt, `original_amount - SUM(payments.amount) > 0`) returns, per `(type, bucketDate)`: debt count, summed remaining, and the **top-2 names by remaining** — everything needed to decide collapse and build copy in a single pass. (Follows the repo rule: aggregate with SQL `SUM`, never JS over `payments[]`.)
- Reconcile **diffs** desired buckets vs. current `reminders` / `group_key` state and only writes/cancels/schedules what changed.
- Cost per sync ≈ 2–3 set queries + at most ~50 native scheduling calls, **independent of debt count**. All behind the mutex (D9).

### D12 — Platform notes
- **Single Android channel** (`owed-reminders`) unchanged. Collapsing is handled by us, not OS thread grouping.
- Notification handler keeps `shouldSetBadge: false` (in-app bell badge only).

---

## 4. Data model changes — migration `004`

```sql
ALTER TABLE reminders ADD COLUMN group_key TEXT;
ALTER TABLE reminders ADD COLUMN archived_at TEXT;

CREATE INDEX IF NOT EXISTS idx_reminders_group_key ON reminders(group_key);
CREATE INDEX IF NOT EXISTS idx_reminders_archived ON reminders(status, archived_at);
```

- `group_key`: `"{type}:{bucketDate}"` for collapsed-bucket members, else `NULL`.
- `archived_at`: ISO timestamp when the inbox row was soft-archived (D7), else `NULL`. Never deleted.
- Existing v0.2/v0.3 indexes and the unique scheduled-dedup indexes (migrations 002, 003) remain.

---

## 5. Notification `data` contract

| Field | Individual (≤5) | Collapsed (≥6) |
|-------|-----------------|----------------|
| `kind` | `"single"` | `"group"` |
| `debtId` | the debt | — (omit) |
| `reminderId` | the reminder | — (omit) |
| `reminderType` | `"due"` / `"overdue"` | `"due"` / `"overdue"` |
| `focusDate` | — | debt `due_date` (`YYYY-MM-DD`) |

- Single tap → `/debt/{debtId}` (unchanged).
- Group tap → `/(tabs)/debts?focusDate={focusDate}&focusType={reminderType}`.
- `parseReminderNotificationData` must accept both shapes and validate `kind`.

---

## 6. Affected files (implementation map)

| Area | File(s) | Change |
|------|---------|--------|
| Migration | `src/lib/db/migrations/004-reminder-grouping.ts` (+ register in `migrations/index.ts`) | Add `group_key`, `archived_at`, indexes |
| Sync engine | `src/features/reminders/lib/reminder-sync.ts`, `reconcile-reminders.ts` | Collapse into serialized `runReminderSync()` w/ mutex, try/catch, SQL-grouped desired-state + diff, rolling window |
| Repository | `src/features/reminders/repositories/reminder-repository.ts` | Grouped desired-state query (top-2 by remaining), `group_key` reads/writes, `archived_at` marking, inbox/unread filters on `archived_at IS NULL` |
| Scheduler/copy | `src/features/reminders/lib/reminder-scheduler.ts` | Collapsed-bucket copy builder (due/overdue), name ordering |
| Notification service | `src/features/reminders/lib/notification-service.ts` | Schedule one push per collapsed bucket; cancel by distinct `notification_id` Set |
| Notification data | `src/features/reminders/lib/notification-data.ts` | `single` vs `group` payload parsing |
| Handlers | `src/features/reminders/lib/register-notification-handlers.ts` | Route `group` taps to filtered Debts screen |
| Add debt | `src/features/debts/screens/add-debt-screen.tsx`, `request-reminder-permissions.ts` | Prompt-on-toggle (D8), inline "notifications off" hint |
| Onboarding | `src/features/onboarding/screens/onboarding-screen.tsx` | Remove the on-mount permission request (#7) |
| Settings | `src/features/settings/screens/settings-screen.tsx` | Call `runReminderSync()` after permission granted (#9) and on time/overdue change |
| Payments | `src/features/debts/hooks/use-record-payment.ts` | Call `runReminderSync()` for all payments (D10) |
| Add debt hook | `src/features/debts/hooks/use-add-debt.ts` | Call `runReminderSync()` |
| Debts screen | `src/features/debts/screens/debts-screen.tsx` (+ `debt-list-utils.ts`) | Read `focusDate`/`focusType` params, transient focused view + dismissible banner |
| App layout | `src/app/_layout.tsx` | Single `runReminderSync()` on start + `AppState → active` |

---

## 7. Acceptance criteria

1. **Partial payment** updates the corresponding OS notification's amount on the next sync — individual push and collapsed-bucket total both reflect the new remaining. (#1, D10)
2. **No unhandled rejections / no unique-index violations** under rapid foreground/background or payment-during-reconcile; concurrent calls coalesce. (#3, D9)
3. **Onboarding never triggers the OS permission dialog.** (#7, D8)
4. Toggling **Remind me** on: primes + prompts when `not-asked`; enables with an inline "notifications off" hint when permanently `off`; silent when `allowed`. Reminder is created in all cases. (#8, D8)
5. **Granting permission** (toggle flow or Settings) attaches windowed OS notifications without needing an app restart. (#9, D9)
6. A day with **6+ due debts** produces **one** collapsed push ("A, B, and N more promised you KES … today"); a day with ≤5 produces individual pushes. Overdue behaves the same with overdue copy. (#4, D2)
7. **Tapping a collapsed push** opens the Debts screen filtered to that day's still-unpaid debts with a dismissible banner; debts paid since fire time are absent. (#4, D4)
8. **Inbox stays per-debt** — a collapsed push still yields one inbox row per person. (D3)
9. **Never more than ~50 pending OS notifications**; nearest buckets always scheduled, far ones topped up over time; inbox still backfills past the window. (#4, D6)
10. **Sync cost is independent of debt count** — bounded set queries + ≤~50 native calls per run; no per-debt round-trip loop. (#5, D11)
11. **Inbox shows only the last 90 days**; older `sent`/`cancelled` rows are soft-marked `archived_at`, **never deleted**. (#6, D7)
12. **Exactly one overdue reminder per debt**, preserved throughout. (constraint)

---

## 8. Verification

Use **Settings → Developer → Seed sample data** (dev builds) to create:
- A day with 6+ debts due → confirm a single collapsed push and correct filtered Debts view on tap.
- A day with ≤5 debts due → confirm individual pushes and per-debt detail on tap.
- Partial payment on a debt in a collapsed bucket → confirm next sync updates the total.
- Toggle reminders with permission `allowed` / `not-asked` / `off` → confirm each D8 path.
- Hundreds of debts across many dates → confirm ≤~50 pending OS notifications and a responsive foreground (no hitch).

Then verify Home, Debts tabs, Activity scroll, and debt-detail payment history per `docs/performance.md`.
