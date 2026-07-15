# ADR-001: Contextual list ordering

**Status:** Accepted
**Date:** 2026-07-15
**Related PRD:** [Sorting and View Options](../sorting-and-view-options-prd.md)

## Context

People, Debts, and Activity answer different user questions. A universal sort menu would be mechanically consistent but product-incoherent: amount is meaningful for balances and promises, while Activity must retain chronological meaning. Fixed ordering alone also stops serving users once their local ledger grows.

Owed is local-first, supports promises in both directions, and avoids presenting net balance or judgmental rankings. Its list architecture must stay responsive with hundreds of records and paginated activity.

## Decision

Adopt one shared **View options** concept with contextual choices per surface:

- People defaults to Needs attention and also supports Name, Recently active, Owes you, and You owe.
- Debts defaults to Needs attention and also supports Promised date, Amount remaining, Recently added, and Person.
- Full Activity supports chronological Newest first and Oldest first only.
- Home and embedded timelines remain curated and are not sortable.
- Reversible criteria use human order labels; Needs attention has a fixed definition.
- Preferences persist locally and independently for each surface. View options live in the header, non-default state is accented, and the selection can be reset.
- Filters/search select the records; sorting orders the selected records.
- Directional People sorts never use net balance.

## Rationale

This model is consistent at the interaction level without pretending the underlying lists serve the same purpose. Meaningful defaults keep Owed useful for users who never configure anything. Contextual choices support real tasks without turning a calm memory aid into a spreadsheet. Visible persisted state preserves user intent without creating a mysterious hidden mode.

## Consequences

### Positive

- The feature reads as a product system rather than three added buttons.
- Defaults prioritize action while explicit criteria support lookup and review.
- Activity keeps its audit-trail semantics.
- Bidirectional balances stay honest and non-netted.
- The model can later accommodate filters without renaming the interaction concept.

### Costs

- People needs additional aggregate date keys for deterministic attention ordering.
- Activity needs true ascending cursor pagination rather than an in-memory reversal.
- Persisted preferences require validation and versioning.
- Working UI review is still required to settle control placement and sheet composition.

## Alternatives rejected

### Universal field menu on every list

Rejected because many options are meaningless on some surfaces and would make Activity cease to read as a timeline.

### One fixed order per screen

Rejected because large ledgers create legitimate, recurring questions that the defaults alone cannot answer.

### Alphabetical People default

Rejected because search already handles direct lookup and alphabetical order hides urgent relationships.

### Raw promised-date Debts default

Rejected because settled records can compete visually with actionable promises and date alone does not express current attention needs.

### Sort People by net balance

Rejected because opposing personal promises are distinct records; netting would imply settlement logic the product does not support.

### Reverse already-loaded Activity events

Rejected because it produces an incomplete false "oldest" view and breaks the pagination/performance contract.
