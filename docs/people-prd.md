# PRD: People Screen (v1)

**Status:** Draft — product/UX approved via grilling, ready for implementation planning
**Baseline:** v0.2 persistence + v0.3/v0.4 reminders shipped
**Scope of this doc:** Product & UX for a person-level view. Data model is **already in place** — see §7. Where this PRD and the code disagree on implementation, **the code wins**.

**Related docs**

| Document | Role |
|----------|------|
| [prd.md](./prd.md) | Original product vision |
| [design-brief.md](./design-brief.md) | Visual tone — calm, private, human |
| [performance.md](./performance.md) | List/query performance — People list **must** use `FlashList` + `listSummaries()` |
| [persistence-prd.md](./persistence-prd.md) | SQLite + React Query patterns |
| [sorting-and-view-options-prd.md](./sorting-and-view-options-prd.md) | Supersedes this PRD's manual-sort deferral and §10 ordering rules |

> This PRD intentionally focuses on the **product/UX** side. The person data model already exists and supports this feature (FK `debts.person_id → people.id`, `personRepository.listSummaries()`, `usePeople()`, prefetch + invalidation). The product agent's original data-model section is superseded by §7. People ordering and manual sort controls are now governed by the Sorting and View Options PRD.

---

## 1. Summary

Owed currently lists **debts** (individual records) but has no way to see money owed **by person**. People already exist as first-class rows (every debt is linked to a `people` row via FK), and there's already a `personRepository.listSummaries()` aggregate and a `usePeople()` hook feeding the add-debt picker — but there is **no People screen and no Person detail screen**.

v1 introduces a **People tab** that replaces Activity in the bottom nav, plus a **Person detail** stack screen. Users see who owes them, the total each person still owes, whether anyone is overdue, and the full per-person history. From a person they can add another debt (name prefilled), edit the person's details, and (later) copy a polite follow-up.

Activity stops being a tab and relocates: a capped **Recent activity** section on Home → **See all** opens a non-tab Activity stack screen; full timelines also live inside Debt detail and Person detail.

No backend. No messaging debtors. A private, relationship-aware memory layer.

---

## 2. Problem

Informal debts are remembered **by person first** — "Brian still owes me", "Grace paid part", "Kevin borrowed twice". A debt-only list fragments this: one person with multiple debts or partial payments becomes several disconnected rows.

Without a People view a user can't easily answer:

- How much does this person owe me **in total**?
- How many active debts does this person have?
- Has this person fully paid previous amounts?
- What's the history between us?
- Which people are overdue?

---

## 3. Goals

| # | Goal |
|---|------|
| G1 | Person-level list: who owes me, total remaining per person, status, last activity |
| G2 | Person detail: totals + active debts + settled debts + per-person payment history |
| G3 | Add a debt for an existing person without retyping their name |
| G4 | Edit a person's name / phone / notes (single source of person metadata) |
| G5 | Search people by name (and phone when present) |
| G6 | Relocate Activity out of the tab bar without losing access to it |

---

## 4. Non-goals (v1)

- **Manual person creation** — no standalone "Add person". People exist only via adding a debt. (No "No debts" person state to design.)
- **Filter chips** (All / Active / Overdue / Settled) — still deferred. Sorting is specified separately in the Sorting and View Options PRD.
- **Copy follow-up message** — deferred to a later phase (copy + tone frozen in §13 so it's drop-in later).
- Contact import, WhatsApp / M-Pesa integration, automatic debtor messaging.
- Duplicate-person merge, relationship/risk scoring, borrowing limits, shared/group debts, public profiles, collection workflows.
- Capturing phone/notes inside the add-debt flow (add-debt stays **name-only**; metadata is edited from Person detail).

---

## 5. Frozen design decisions

Agreed via grilling (§14). Do not re-litigate without product sign-off.

| Topic | Decision |
|-------|----------|
| **Nav change** | People **replaces** Activity as a tab. Tabs become: Home · Debts · People · Settings |
| **Activity relocation** | Capped "Recent activity" section on Home (last ~5) → **See all** opens a non-tab Activity stack screen. Full timelines live in Debt detail + Person detail |
| **Person scope** | People list = everyone with **≥1 non-archived linked debt**. No manual person creation in v1 |
| **Person metadata** | **Edit Person** screen is the single place to set name/phone/notes. Add-debt stays name-only. Person detail hides phone/notes when empty |
| **Person status** | Four states, priority **Overdue > Due soon > Active > Settled** (mirrors the debt engine, incl. `due-soon`) |
| **Sort** | Superseded by [Sorting and View Options](./sorting-and-view-options-prd.md) |
| **Search** | Name match always; phone match when phone present |
| **v1 cut** | People list + Person detail + Add-debt-for-person + Edit Person + Search. **Defer:** filter chips, copy follow-up |
| **Tone** | Calm, private, non-judgmental. Status vocab only: Overdue / Due soon / Active / Settled / Partially paid |

---

## 6. User stories & acceptance

### 6.1 View People list

As a user, I want to see everyone who owes me money so I understand my situation by person.

**Person card shows**

- Person name (+ initials avatar, reusing `PersonRow` styling from the picker)
- Total amount remaining (`formatCurrency`, KES)
- Active-debt count (debts with remaining balance > 0)
- Status pill when not plain Active (Overdue / Due soon)
- Last activity date (relative, e.g. "yesterday")

**Acceptance**

- List renders via **`FlashList`** (not `ScrollView` + `.map()`) — performance.md.
- Data comes from `personRepository.listSummaries()` (SQL aggregate), **not** loading debts/payments per person.
- Only people with ≥1 non-archived debt appear.
- Optional top summary line: `"{N} people · {formatCurrency(total)} total owed"`.
- Tapping a card → Person detail (`/person/[id]`).

Example card:

```
Brian Mwangi
KES 4,200 owed
2 active · 1 overdue
Last updated yesterday        [Overdue]
```

### 6.2 Search people

As a user, I want to find a person quickly.

**Acceptance**

- Search input, placeholder `"Search people"`.
- Matches person **name** (via `normalizePersonName` — accent-fold + case-insensitive) and **phone** when present.
- No result → `"No person found."` / `"Try searching by name or phone number."`
- Search filters the same `FlashList` (no separate screen).

### 6.3 View Person detail

As a user, I want to open a person and see everything connected to them.

**Sections (in order)**

1. **Summary card** — total remaining, supporting line (`"Across N active promises"`), status (Overdue / Due soon / Active / Settled).
2. **Person details** — name, phone (if present), notes (if present). Hidden rows when empty.
3. **Active debts** — debts with remaining balance > 0.
4. **Settled debts** — fully paid debts (collapsed by default when many).
5. **Payment history** — chronological per-person activity (reuses Activity row UI).

**Actions**

- Add debt for this person
- Edit person
- (Later) Copy follow-up message

**Acceptance**

- Stack route `/person/[id]`, native header title = person name, status `Badge` in/near header (follows `debt/[id]` pattern).
- Totals computed from linked debts (SQL aggregate where listy); detail-level payment rows may load per debt only within the detail context (mirrors `debt-repository.getById`).
- Active/settled debt rows reuse `DebtCard`-style rows; tapping a debt → existing Debt detail (`/debt/[id]`).
- Totals reflect non-archived debts; archived debts excluded from totals.

Example summary:

```
KES 4,200 remaining
Across 2 active promises · 1 overdue
```

### 6.4 Active debts section

Each active debt row shows: remaining amount, original amount (when partially paid), due date, status badge, reason preview.

```
KES 2,000 remaining   ·   Due Friday   [Partial]
Original KES 3,000 · Rent support
```

### 6.5 Settled debts section

Collapsed by default when there are many. Each row: original amount, paid date, reason preview.

```
KES 1,500 settled · Paid 12 Jun · Lunch + cab
```

### 6.6 Person payment history

Chronological repayment/activity for this person. **Reuses** the existing Activity row component (`ActivityView` + `ActivityRow`) and `build-activity-view` copy:

- `"You added KES X owed by {name}"`
- `"{name} paid KES X"`
- `"{firstName}'s debt was marked as paid"`

**Acceptance:** scoped to this person's `activity_events` (FK `person_id` already exists), newest first.

### 6.7 Add debt for existing person

As a user, I want to add a new debt from a person's detail page without re-entering their name.

**Acceptance**

- "Add debt" action on Person detail opens the existing add-debt flow with `PersonRef = { kind: "existing", id }` prefilled and the person field locked/preselected.
- User enters amount, due date, reason, reminder settings (same as today).
- New debt links to the existing person row (no new person created).
- On save, `people`, `debts`, `activities`, `reminders` caches invalidate (already wired) so person totals update immediately.

### 6.8 Edit person

As a user, I want to correct a person's name, phone, or notes.

**Editable fields:** name (required), phone (optional), notes (optional).

**Acceptance**

- Edit Person screen/modal, CTA `"Save changes"`.
- Saving updates the single `people` row → every linked debt reflects the change (FK, so name flows everywhere automatically).
- Requires a new repository method (§7 gap): `personRepository.update(id, { name, phoneNumber?, notes? })`.
- Empty name blocks save with inline validation.
- Invalidate `people` (and `debts` if the name is denormalized into any cached view) on save.

### 6.9 (Later) Copy follow-up message

Deferred. Tone + templates frozen in §13 for drop-in. App only generates **copyable** text; never sends.

---

## 7. Implementation reality (code is source of truth)

The data model already supports this feature. **Do not re-design it.** Snapshot of what exists:

### Already in place

| Piece | Location | Notes |
|-------|----------|-------|
| `people` table | `migrations/001-initial.ts` | `id, name, phone_number, notes, created_at, updated_at` |
| Debt → person FK | `debts.person_id NOT NULL REFERENCES people(id)` | List queries JOIN people for name/phone/notes |
| Activity → person FK | `activity_events.person_id` | Enables per-person history with no schema change |
| Person aggregate | `personRepository.listSummaries()` | Returns `PersonSummary { id, name, outstanding, openDebtCount, lastActivityAt }`, SQL `SUM`, ordered `last_activity_at DESC, name` |
| Single person read | `personRepository.getById(id)` | Returns full `Person` |
| Person create | `personRepository.create(name)` | Name only; phone/notes set NULL |
| React Query | `usePeople()` / `fetchPeoplePickerViews` / `peopleKeys.all` | `staleTime: Infinity`, prefetched in `_layout.tsx`, invalidated on add-debt / record-payment / seed |
| Row UI reference | `PersonRow` in `person-picker-sheet.tsx` | Avatar + name + outstanding + open count |
| Name search | `normalizePersonName`, `isSamePersonName` | Accent-fold, case-insensitive |
| Existing-vs-new person | `PersonRef` + `debt-repository.resolvePerson` | Add-debt already links to existing people |

### Gaps to close for v1 (engineering — keep minimal)

1. **`personRepository.update(id, fields)`** — for Edit Person (does not exist).
2. **Person-scoped debt query** — e.g. `debtRepository.listSummariesForPerson(personId)` returning `DebtSummary[]` (active + settled), reusing the existing JOIN/`paid_total` subquery. No per-payment loading on the list path.
3. **`PersonListView` shape** — extend `fetch-people.ts` so the People list has what the card needs (`lastActivityAt`, `phoneNumber`, derived `status`, `overdueCount`). `PersonPickerView` currently strips these.
4. **`lastActivityAt` accuracy** — `listSummaries()` currently computes it as `MAX(debt.created_at)`, **excluding payments**. Product intent for "Last updated" = most recent of {debt added, payment recorded, marked paid}. Update the SQL to `MAX` over `debts.created_at` and `payments.created_at` (or use `activity_events.occurred_at`).
5. **Person detail totals** — `original_amount` sum + `remaining` sum + counts of active/overdue/due-soon/paid debts. Derive from a single aggregate query, not JS over payment arrays.

> **No schema migration is required for v1.** Everything maps onto existing tables/FKs. (Status is derived, never stored — see §8.)

---

## 8. Person status logic

Person status is **derived** from that person's non-archived debts, reusing the debt status engine (`computeDebtStatus`: priority `archived > paid > partial > overdue > due-soon > active`).

Roll up to a single person status by **highest-severity** debt:

| Person status | Condition | Pill |
|---------------|-----------|------|
| **Overdue** | Any debt is `overdue` (remaining > 0, due date before today) | `Overdue` |
| **Due soon** | No overdue, but any debt is `due-soon` (remaining > 0, due within `APP_CONFIG.dueSoonDays` = 3) | `Due soon` |
| **Active** | Has remaining balance > 0, none overdue/due-soon | none (default) |
| **Settled** | No remaining balance; ≥1 paid debt | `Settled` (muted) |

Notes:

- "Partially paid" stays a **debt-level** descriptor (shown on debt rows), not a person status.
- No "No debts" state in v1 (no manual creation; archived-only people excluded).
- Status drives both the pill and the sort key (§10).

---

## 9. Navigation changes

### Tabs (Expo Router `NativeTabs`, `src/app/(tabs)/_layout.tsx`)

| Before | After |
|--------|-------|
| Home · Debts · **Activity** · Settings | Home · Debts · **People** · Settings |

- Add `NativeTabs.Trigger name="people"`; remove the `activity` trigger.
- New tab route: `src/app/(tabs)/people/index.tsx` → re-exports `PeopleScreen`.

### Activity relocation

- **Home:** add a capped "Recent activity" section (last ~5 events), reusing `ActivityList`/`ActivityRow`, with a **See all** affordance.
- **Stack route:** move the full Activity screen to a non-tab stack route (e.g. `src/app/activity.tsx`) reached via "See all". Keep `activity-screen.tsx`, `use-activities`, `activity-repository` as-is.
- **Detail timelines:** per-person history (§6.6) and existing Debt-detail payment history remain.

### New stack routes

| Route | Screen | Pattern to follow |
|-------|--------|-------------------|
| `/person/[id]` | Person detail | `debt/[id]` (native header = name, status `Badge`) |
| `/person/[id]/edit` (or modal) | Edit Person | `record-payment` / `add-debt` modal |
| `/activity` | Full Activity (relocated) | existing `activity-screen.tsx` |

---

## 10. Sorting

Superseded by [PRD: Sorting and View Options](./sorting-and-view-options-prd.md), which retains a deterministic Needs attention default and adds user-selectable People orders.

---

## 11. Screens

### 11.1 People list

- Wrapper: `TabScreen` (`#F7F5F1` bg, safe area), `useTabScrollPadding()` for tab-bar inset.
- Header: `"People"` (28px / 700 / `#1A1A18`), subtitle `"See what each person still owes."`
- Optional summary line: `"{N} people · {formatCurrency(total)} total owed"`.
- Search input below header.
- `FlashList` of person cards.
- **Empty state:** `"No people yet."` / `"People will appear here when you add your first amount owed."` CTA: `"Add debt"`.
- Loading: return `null` while `isPending` (consistent with Home/Debts/Activity).

### 11.2 Person detail (`/person/[id]`)

- Native header: back, person name, Edit action, status `Badge`.
- Summary card → Person details → Active debts → Settled debts (collapsible) → Payment history.
- Actions: Add debt for this person; Edit person.
- **Empty states:**
  - No active debts: `"Nothing pending."` / `"All amounts from {name} are settled."` CTA `"Add new debt"`.
  - No settled debts: `"No settled amounts yet."` / `"Paid debts from this person will appear here."`

### 11.3 Edit person (`/person/[id]/edit` or modal)

- Fields: Name (required), Phone (optional), Notes (optional).
- CTA: `"Save changes"`; inline error if name empty.

---

## 12. Components

| Component | New / reuse |
|-----------|-------------|
| Person card (list row) | New — adapt `PersonRow` styling from `person-picker-sheet.tsx` |
| Person status pill | Reuse/extend `Badge` (`components/ui/badge.tsx`) |
| Person summary card | New |
| Person debt row | Reuse `DebtCard`-style row |
| Payment history item | **Reuse** `ActivityRow` / `ActivityView` |
| Search input | Reuse existing search input pattern (Debts tab / picker) |
| Empty People state | New (calm copy) |
| Edit person form | New (mirror add-debt fields) |
| Add-debt-for-person CTA | Reuse add-debt flow with prefilled `PersonRef` |
| Copy follow-up card | **Deferred** (§4) |

---

## 13. Follow-up message (deferred — frozen for later phase)

When built, Person detail generates a **copyable** template based on active debts. App never sends.

| Case | Template |
|------|----------|
| One debt due today | `"Hey {name}, just a reminder about the {amount} you said you'd send today."` |
| One overdue debt | `"Hey {name}, checking in on the {amount} that was due {relativeDay}. Let me know when you're able to send it."` |
| Multiple active debts | `"Hey {name}, just checking in on the {totalRemaining} still pending. Are you able to send it today?"` |
| Multiple debts incl. overdue | `"Hey {name}, checking in on the {totalRemaining} still pending, including the amount that was due {relativeDay}. Let me know when you're able to send it."` |

Tone: polite, casual, non-aggressive. **No** shame/legal/collection language ("defaulter", "chase", "blacklist", etc.).

---

## 14. Edge cases

| Case | Behavior |
|------|----------|
| Person has multiple active debts | Show total remaining at top; list each debt separately |
| One partially paid debt | Show remaining clearly + original amount; debt row badge `Partial` |
| Only paid debts | Person status `Settled`, total remaining KES 0 |
| Person has no non-archived debts | Excluded from People list (no manual creation in v1) |
| Archived debt | Excluded from active totals/counts; may appear in history if archived view added later |
| Payment added | Person totals/status update immediately (cache invalidation already wired) |
| Debt marked paid | Person status recomputes from remaining debts |
| Duplicate names | Allowed (picker already permits explicit new-person create); no merge in v1 |
| Long settled list | Settled section collapsed by default |

---

## 15. UX principles

- **Relationship-first clarity** — answer "who owes me and how much" at a glance.
- **Calm, not judgmental** — only Overdue / Due soon / Active / Settled / Partially paid. Never "bad payer", "defaulter", "risky", "blacklist", "chase".
- **Lightweight, not CRM-like** — a private memory layer, not customer management.
- **Reduce repeated entry** — once a person exists, never retype their name.

---

## 16. Delivery plan

One feature branch, staged commits; each commit leaves the app buildable.

| Stage | Scope | Review focus |
|-------|-------|--------------|
| **1 — Data layer** | `listSummariesForPerson`, `PersonListView` in `fetch-people.ts`, person-detail aggregate, `lastActivityAt` fix, `personRepository.update` | SQL correctness, no per-payment loading on lists, status derivation |
| **2 — People tab** | `(tabs)/people/index.tsx`, `PeopleScreen`, `PersonCard`, `FlashList`, smart sort, status pills, empty state; swap Activity→People trigger | Tab swap, FlashList perf, sort/pills |
| **3 — Activity relocation** | Home "Recent activity" + See all; `/activity` stack route | Activity still reachable; Home preview capped |
| **4 — Person detail** | `/person/[id]`: summary, details, active/settled sections, payment history (reuse `ActivityRow`) | Totals accuracy, collapse behavior, debt-row tap → `/debt/[id]` |
| **5 — Add debt for person** | Prefilled `PersonRef` into add-debt; CTA on detail | Links to existing person, totals refresh |
| **6 — Edit person + search** | Edit screen/modal (`personRepository.update`), People search (name + phone) | Name flows everywhere, validation, search matching |

Deferred to a later phase: filter chips, copy follow-up message.

---

## 17. Manual test plan

Use Settings → Developer → Seed sample data (dev builds — seeder populates phone ~40% / notes ~15%, ideal for this screen).

| # | Scenario | Expected |
|---|----------|----------|
| T1 | Open People tab with seeded data | People list renders via FlashList; each card shows name, remaining, active count, last activity |
| T2 | Person with an overdue debt | Card + detail show `Overdue` pill; sorted to top |
| T3 | Person with a debt due in ≤3 days, none overdue | `Due soon` pill |
| T4 | Person with all debts paid | `Settled`, remaining KES 0 |
| T5 | Open Person detail | Summary total = sum of remaining; active & settled sections correct; payment history newest-first |
| T6 | Settled section with many items | Collapsed by default |
| T7 | Add debt from Person detail | Person prefilled & locked; new debt links to same person; totals update without refresh |
| T8 | Edit person name | Name updates on People list, Person detail, Debt detail, Activity copy |
| T9 | Edit phone/notes then clear | Empty rows hidden on detail; search by phone works when present |
| T10 | Search by name (accented / mixed case) | Matches via normalization; no-result copy on miss |
| T11 | Record a payment elsewhere, return to People | Person remaining + status reflect the payment |
| T12 | Activity relocated | Activity not a tab; Home shows capped recent activity; See all opens full Activity |
| T13 | Seed 50+ people | People list scrolls smoothly (FlashList); no per-person payment loads |

---

## 18. Success metrics

- # people with active debts (engagement surface size)
- # Person-detail views
- # debts added from Person detail (vs. fresh add-debt)
- % debts linked to an existing person (de-dup proxy)
- # People searches
- # Edit-person saves
- (When follow-up ships) # copied person-level follow-up messages

---

## 19. Agent checklist

- [ ] Read [performance.md](./performance.md) — People list uses `FlashList` + `listSummaries()`-style aggregates; **never** load payment rows per person on list paths
- [ ] No schema migration needed — reuse `people` / `debts` / `payments` / `activity_events` FKs
- [ ] Status is **derived** via `computeDebtStatus`, rolled up Overdue > Due soon > Active > Settled — never stored
- [ ] `staleTime: Infinity` on new people queries; invalidate in mutations only (add-debt / record-payment / edit-person already partly wired)
- [ ] Add-debt stays name-only; metadata only via Edit Person
- [ ] No manual person creation; People list = people with ≥1 non-archived debt
- [ ] Fix `lastActivityAt` to include payments
- [ ] Reuse `ActivityRow` for per-person history; reuse `PersonRow` styling for cards
- [ ] All IDs via `createId()`; currency via `formatCurrency` (KES, whole units)
- [ ] Do not message debtors — copy-only follow-up, and that's deferred

---

## 20. Reference: grilling decision log

| # | Question | Answer |
|---|----------|--------|
| 1 | Where does Activity go once People takes its tab? | Home "Recent activity" (capped) + See all → non-tab Activity stack; timelines in Debt/Person detail |
| 2 | Phone/notes handling given add-debt is name-only | Edit Person screen is the single metadata source; add-debt stays name-only; hide empty fields |
| 3 | Manual person creation (people without debts)? | No — people exist only via adding a debt; list = people with ≥1 linked debt |
| 4 | Person status vocabulary | Four states: Overdue > Due soon > Active > Settled (mirrors debt engine incl. due-soon) |
| 5 | v1 cut vs. deferred | Ship list + detail + add-debt-for-person + edit + search; defer filter chips + copy follow-up |
