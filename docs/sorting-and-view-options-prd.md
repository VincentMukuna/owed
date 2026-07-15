# PRD: Sorting and View Options

**Status:** Implemented 2026-07-15; on-device interaction review pending
**Scope:** People, Debts, and the full Activity feed
**Decision record:** [ADR-001: Contextual list ordering](./decisions/001-contextual-list-ordering.md)

## Related documents

| Document                                                     | Relationship                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| [prd.md](./prd.md)                                           | Original product intent and core user stories                  |
| [people-prd.md](./people-prd.md)                             | People model, recognition cues, and prior smart-default intent |
| [bi-directional-debts-prd.md](./bi-directional-debts-prd.md) | Directional balances and the prohibition on net-first UI       |
| [design-brief.md](./design-brief.md)                         | Calm, private, card-light interaction principles               |
| [performance.md](./performance.md)                           | Mandatory list, query, mapper, and load-test constraints       |

> **Precedence:** Where another document specifies list ordering or says manual sorting is out of scope, this PRD supersedes that statement for People, Debts, and the full Activity feed only. Other requirements in those documents remain unchanged.

---

## 1. Summary

Owed should let users reorder People, Debts, and the full Activity feed according to the question they are trying to answer. Sorting must feel like part of a coherent view system, not a separate icon patched onto each screen.

Each surface gets:

- A purposeful default order based on the surface's job.
- A small set of relevant sort criteria rather than a universal menu.
- A context-aware order choice such as A-Z / Z-A, Most / Least, or Newest / Oldest.
- A compact header action; non-default ordering is indicated by its accent state.
- A per-screen preference remembered on the device.
- A clear way to return to that surface's default.

The three defaults are:

| Surface  | Default             | Product question answered           |
| -------- | ------------------- | ----------------------------------- |
| People   | **Needs attention** | Who should I deal with next?        |
| Debts    | **Needs attention** | Which promise should I act on next? |
| Activity | **Newest first**    | What happened most recently?        |

Home remains intentionally curated and is not user-sortable.

---

## 2. Problem

The current product has useful but inconsistent implicit ordering:

- People is alphabetic in the current UI, although the People PRD intended an urgency-first default.
- Debts is ordered by promised date, with different behavior depending on the selected status.
- Activity is newest-first with no alternative.

As users accumulate hundreds of promises and events, one fixed order cannot support all of their tasks. A user may need to find the person requiring attention, identify their largest exposure, work through the nearest promises, locate a recently added record, or reconstruct a history from the beginning.

Adding unrelated sort buttons would create a second problem: users would have to relearn the behavior on each screen, active state could become invisible, and filter/sort responsibilities would blur.

---

## 3. Product thesis

Sorting in Owed is a **view preference**, not a change to financial data and not a ranking of people's character.

The system should:

1. Start in a useful order without requiring configuration.
2. Describe ordering in calm, human language.
3. Keep filtering and sorting conceptually distinct.
4. Preserve directionality; never invent a net balance to rank people.
5. Remember intentional choices without hiding them.
6. Keep chronological records chronological.

---

## 4. Real user cases

### 4.1 People

| Situation                       | User question                                  | Appropriate order                |
| ------------------------------- | ---------------------------------------------- | -------------------------------- |
| Friday follow-ups               | "Who needs my attention first?"                | Needs attention                  |
| Cash-flow check                 | "Who owes me the most?"                        | Owes you · Most first            |
| Planning repayments             | "Who do I owe the most?"                       | You owe · Most first             |
| Finding a contact               | "Where is Wanjiku?"                            | Name · A-Z, or search            |
| Recalling a recent conversation | "Who did I update yesterday?"                  | Recently active · Newest first   |
| Tidying small balances          | "Which small amount could be settled quickly?" | Directional amount · Least first |

### 4.2 Debts

| Situation                      | User question                            | Appropriate order              |
| ------------------------------ | ---------------------------------------- | ------------------------------ |
| Daily review                   | "What should I handle next?"             | Needs attention                |
| Calendar planning              | "What is promised first?"                | Promised date · Earliest first |
| Cash exposure                  | "What is the largest unsettled promise?" | Amount remaining · Most first  |
| Correcting an entry            | "Where is the promise I just added?"     | Recently added · Newest first  |
| Reviewing one person's entries | "Show Brian's promises together."        | Person · A-Z, or search        |

### 4.3 Activity

| Situation                | User question                                     | Appropriate order |
| ------------------------ | ------------------------------------------------- | ----------------- |
| Normal review            | "What changed most recently?"                     | Newest first      |
| Reconstructing a history | "How did this ledger develop from the beginning?" | Oldest first      |

Questions such as "What happened with Brian?" and "Show only payments" are future search/filter problems. They are not sorting modes.

---

## 5. Goals

| #   | Goal                                                                      |
| --- | ------------------------------------------------------------------------- |
| G1  | Make large People and Debts lists actionable without requiring search     |
| G2  | Give every sortable surface a meaningful, documented default              |
| G3  | Establish one reusable View options concept across the product            |
| G4  | Make customized ordering apparent without consuming persistent list space |
| G5  | Remember each screen's choice locally and independently                   |
| G6  | Preserve smooth list behavior with hundreds of debts and activity events  |
| G7  | Keep bidirectional balances explicit and avoid net-based ranking          |

---

## 6. Non-goals

- Sorting Home sections or changing Home into a configurable dashboard.
- Arbitrary Activity ordering by person, amount, direction, or event type.
- Grouping, pinning, saved views, or custom multi-column sorting.
- Adding new People filters as part of this feature.
- Changing debt direction, status, amount, or any persisted financial record.
- Net balance ranking or automatic settlement between opposing promises.
- Syncing view preferences across devices or including them in backup/export.
- Finalizing pixel placement, icon choice, animation, or sheet height before a working interaction review.

---

## 7. Frozen product decisions

These decisions were approved during product grilling.

| Topic                | Decision                                                                            |
| -------------------- | ----------------------------------------------------------------------------------- |
| Preference lifetime  | Remember the selected order locally, independently for each screen                  |
| Visibility           | Keep View options in the header, accent it for non-default state, and provide Reset |
| Control model        | Select a criterion, then a context-aware order when that criterion is reversible    |
| People default       | Needs attention                                                                     |
| Debts default        | Needs attention                                                                     |
| Activity default     | Newest first                                                                        |
| Activity scope       | Chronological ordering only: Newest first or Oldest first                           |
| Home                 | Curated, not sortable                                                               |
| Directional balances | Separate Owes you and You owe criteria; never sort by net balance                   |
| Filters              | Apply filters first, then sort the matching results                                 |

---

## 8. Shared View options model

### 8.1 Mental model

The product-level concept is **View options**. It answers two distinct questions:

- **Which records should appear?** Filters and search.
- **In what order should those records appear?** Sort criterion and order.

Where a screen already has a Filters sheet, sorting belongs in that same view-management surface. A screen without filters may use a smaller View options surface. Exact presentation is an interaction-design decision, but the language and behavior must remain consistent.

### 8.2 Criterion and order

The user first chooses a criterion. Reversible criteria then expose meaningful order labels:

| Data type        | Order labels                                                  |
| ---------------- | ------------------------------------------------------------- |
| Name/person      | A-Z / Z-A                                                     |
| Amount           | Most first / Least first                                      |
| Date or activity | Newest first / Oldest first, or Earliest first / Latest first |
| Needs attention  | Fixed; no reverse option                                      |

Avoid an unexplained ascending/descending arrow inside the sheet. The selected state should read naturally, for example:

- `Needs attention`
- `Owes you · Most first`
- `Promised date · Earliest first`
- `Name · A-Z`

### 8.3 Persistence

- People, Debts, and Activity each own a separate stored preference.
- A choice survives navigation and app restarts on the same device.
- First use, missing storage, invalid values, or a future removed option falls back safely to the surface default.
- Preference storage is versioned so future migrations can be explicit.
- Reset restores only the current surface's default order; it does not clear filters or search unless the user chooses a broader Reset all action in a combined sheet.
- Presentation preferences are not financial data and are excluded from Owed backup, restore, and CSV export.

### 8.4 Interaction behavior

- Changing order takes effect immediately and scrolls the list to the top.
- Search results retain the selected order.
- Filter changes retain the selected order.
- Returning from a detail or edit flow preserves the list order and, where platform navigation permits, the scroll position.
- In a combined Filters/View sheet, the active sort is never counted as an active filter. The entry point may still indicate that the view differs from its default.
- Empty states describe the filter/search result, not the sorting mode.

---

## 9. People requirements

### 9.1 Default: Needs attention

Needs attention is a deterministic priority order, not an opaque recommendation algorithm.

Order people by the following buckets:

1. **Overdue** — earliest overdue promised date first.
2. **Due soon** — nearest upcoming promised date first.
3. **Other unsettled** — largest directional balance first.
4. **Settled or no active promises** — most recent financial activity first.
5. **Name** — accent-folded A-Z as the final stable tie-breaker in every bucket.

For a person with promises in both directions, "largest directional balance" means:

```txt
max(owedToYou, youOwe)
```

It does **not** mean their net balance and does not add the two directions into a primary user-facing financial concept.

### 9.2 Available criteria

| Criterion       | Orders          | Definition                                                                                       |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| Needs attention | Fixed           | §9.1                                                                                             |
| Name            | A-Z / Z-A       | Accent-folded person name                                                                        |
| Recently active | Newest / Oldest | Most recent debt creation or payment; person creation is fallback when no financial event exists |
| Owes you        | Most / Least    | Remaining balance where direction is `they_owe_me`                                               |
| You owe         | Most / Least    | Remaining balance where direction is `i_owe_them`                                                |

For directional amount sorts:

- People with a positive value in the chosen direction appear before people with zero in that direction.
- `Least first` means the smallest **positive** matching balance first; zero-value people remain at the end rather than overwhelming the result.
- Ties use recently active, then name A-Z.

### 9.3 Product language

Use `Owes you` and `You owe` for criteria. Do not use `Debtor`, `Creditor`, `Exposure`, `Risk`, or `Net worth` in user-facing UI.

---

## 10. Debts requirements

### 10.1 Default: Needs attention

Needs attention orders individual promises as follows:

1. **Overdue** — oldest missed promised date first.
2. **Due soon** — nearest promised date first.
3. **Other unsettled** — nearest promised date first.
4. **Undated** — newest added first, if undated promises are supported in the future.
5. **Settled** — most recently settled first.
6. **Person name, then debt id** — stable tie-breakers.

This ordering does not introduce optional due dates. The undated branch is defensive for imported or future-compatible records.

When a status filter narrows the list, the relevant part of the same order applies. For example, Paid + Needs attention means most recently settled first.

### 10.2 Available criteria

| Criterion        | Orders            | Definition                                                        |
| ---------------- | ----------------- | ----------------------------------------------------------------- |
| Needs attention  | Fixed             | §10.1                                                             |
| Promised date    | Earliest / Latest | Raw promised date; undated records remain last in both directions |
| Amount remaining | Most / Least      | Current remaining balance                                         |
| Recently added   | Newest / Oldest   | Debt creation timestamp                                           |
| Person           | A-Z / Z-A         | Accent-folded person name                                         |

For Amount remaining:

- Positive balances precede zero balances.
- `Least first` means the smallest positive remaining amount first.
- Settled zero-balance debts remain at the end unless the Paid filter is active.
- When every result is settled, fall back to most recently settled, then recently added.

### 10.3 Relationship to existing controls

- Direction, status, date range, and search remain filters.
- The pipeline is: source summaries → filter/search in one pass → sort matching records → render.
- A dashboard deep link that opens Debts with a transient focus keeps the user's saved Debts order. A single-date reminder focus may naturally produce no visible difference between date orders.
- Reset to default restores Needs attention without changing the user's direction, status, date range, or search state.

---

## 11. Activity requirements

### 11.1 Full Activity feed

The full Activity feed supports exactly two orders:

| Order        | Use                                       |
| ------------ | ----------------------------------------- |
| Newest first | Default review of recent changes          |
| Oldest first | Reconstruct the ledger from its beginning |

Activity remains an audit-style narrative. Do not sort it by amount, person, event type, or direction.

### 11.2 Embedded timelines

The following are curated context, not general list-management surfaces, and stay newest-first without controls:

- Home's Recent activity section.
- Person detail activity/history.
- Debt detail payment/history.

Future search or filters on the full feed may narrow the timeline, but the resulting events must still be chronological.

### 11.3 Pagination contract

Oldest-first must be implemented as a true database/cursor order. The app must not fetch the entire activity history, reverse it in memory, and then render it.

- The selected order is part of the Activity query key.
- Each direction has matching SQL `ORDER BY`, cursor comparison, and deterministic id tie-breaker.
- Switching order starts at the correct end of the timeline and scrolls to the top.
- Existing page-size and `FlashList` behavior remain intact.

---

## 12. Home boundary

Home is a summary and prioritization surface, not a second Debts screen.

- Its Overdue, Due soon, Active, and Recent activity sections keep product-defined ordering.
- It exposes no View options or sort preference.
- "See all" destinations open the relevant full surface, where that surface's saved preference applies.

This prevents configuration from spreading into every section and keeps Home immediately understandable.

---

## 13. Data and implementation requirements

This section constrains implementation without prescribing component details.

### 13.1 People and Debts

- Follow [performance.md](./performance.md).
- Continue using `personRepository.listSummaries()` and `debtRepository.listSummaries()` for list paths.
- Do not load payment arrays or perform per-row repository calls to obtain sort keys.
- Add any missing raw sort fields to summary/domain/view shapes once per list query.
- People Needs attention requires aggregate keys for earliest overdue date and earliest due-soon date; compute them in the person summary SQL.
- Debt criteria require raw `createdAt`, due date, remaining amount, last payment/settlement timestamp, and normalized person name to be available without detail loads.
- Apply derivation with `useMemo` and list utilities, not chained filters in JSX.
- Comparators must be total and deterministic so rows do not jump unpredictably on equal values.
- Keep `FlashList`; changing order must not remount every row unnecessarily.

### 13.2 Preferences

- Store a small, typed, versioned presentation preference per surface using the existing local storage abstraction.
- Validate stored values at the boundary rather than trusting parsed JSON.
- Preference writes must not invalidate React Query data because no domain record changed.

### 13.3 Activity

- Extend the repository pagination contract to accept chronological direction.
- Include direction in infinite-query keys and cursor logic.
- Keep `staleTime: Infinity`; mutations continue to invalidate Activity queries.
- Never materialize all activity pages to support Oldest first.

---

## 14. Accessibility and calm UX

- The control exposing View options has an accessibility label that includes the current order.
- Selected criterion and order are announced as selected, not communicated through color alone.
- Labels use words in addition to any directional icon.
- Dynamic type must not truncate selected criterion and order labels inside View options.
- Reordering must not trigger warning haptics or aggressive motion.
- Do not use red or status severity to decorate sort options; urgency belongs to the records themselves.
- Screen-reader focus returns to a sensible location when the options surface closes.

---

## 15. Acceptance criteria

### Shared

- People, Debts, and full Activity expose their approved orders and no unrelated criteria.
- View options consume no persistent list row; a non-default order accents the header action and the exact selection remains checked in the sheet.
- Each surface remembers its order across navigation and app restart.
- Reset restores only that surface's default ordering.
- Search and filters apply before sorting and do not erase the saved order.
- Changing order scrolls the list to the top.
- Invalid or obsolete stored values fall back without crashing.
- Home and embedded detail timelines do not expose sorting controls.

### People

- First use defaults to Needs attention.
- Overdue and due-soon people are ordered by their relevant earliest promised date.
- Mixed-direction people are never ranked by a net balance.
- Owes you and You owe amount sorts use separate directional values.
- Least-first amount sorting keeps zero-value people below positive matches.
- Name sorting is accent-folded and deterministic.

### Debts

- First use defaults to Needs attention.
- Needs attention places unsettled overdue/due-soon/active promises before settled promises.
- Paid + Needs attention shows most recently settled first.
- Amount remaining least-first does not place settled zero balances above positive balances in mixed results.
- Existing direction, status, date-range, dashboard-focus, and search behavior remains functional.

### Activity

- First use defaults to Newest first.
- Oldest first begins with the earliest event and paginates forward without loading the entire history.
- Equal timestamps use a stable id tie-breaker in both directions.
- Switching order resets pagination and does not mix pages from opposite directions.

### Performance verification

- Seed sample data using Settings → Developer → Seed sample data.
- Verify all People and Debts criteria with hundreds of records.
- Verify both Activity directions across multiple pages.
- Confirm scrolling remains smooth and no list path loads payment arrays or performs N+1 queries.

---

## 16. Delivery outline

1. **Foundation** — typed sort contracts, versioned preferences, shared language and reset behavior.
2. **People** — missing aggregate sort keys, deterministic comparators, preference integration.
3. **Debts** — Needs attention comparator, field criteria, integration with existing filters.
4. **Activity** — bidirectional cursor pagination and chronological preference.
5. **Interaction pass** — working implementation review for placement, iconography, sheet composition, and motion.
6. **Scale verification** — seeded-data matrix, accessibility checks, and regression tests.

---

## 17. Product glossary

| Term                | Meaning in Owed                                                                      |
| ------------------- | ------------------------------------------------------------------------------------ |
| View options        | The coherent product surface for controlling what a list shows and how it is ordered |
| Sort criterion      | The field or product rule used to order records, such as Name or Needs attention     |
| Order               | The meaningful direction for a reversible criterion, such as A-Z or Most first       |
| Needs attention     | A documented, deterministic urgency order; not an algorithmic recommendation         |
| Recently active     | Latest financial activity involving a person, with creation as fallback              |
| Directional balance | Either Owes you or You owe; never a net of the two                                   |
| Full Activity feed  | The paginated `/activity` history, distinct from capped or detail-level timelines    |

---

## 18. Remaining design validation

No unresolved product decision blocks implementation planning. Exact placement, icon choice, sheet layout, and animation should be evaluated against a working implementation rather than frozen in this PRD.
