# Backup & Restore Implementation Plan

**Status:** Ready for implementation planning  
**Source PRD:** [backup-restore-prd.md](./backup-restore-prd.md)  
**Branch:** `feature-export`

This plan distills the PRD into phases for an implementation agent. It intentionally defines outcomes, invariants, and release gates rather than prescribing exact code structure.

---

## Core Contract

Backup & Restore is a full local app-state preservation feature.

It must:

- Back up the complete local SQLite dataset.
- Back up persisted local settings and onboarding state.
- Restore by replacing the current local app state after destructive confirmation.
- Leave OS-level notification permission unchanged.
- Cancel current scheduled Owed notifications during restore, then reconcile reminders from restored data.
- Work without accounts, cloud sync, or internet access.
- Support restoring older backups in newer app versions.

The migration guarantee is part of the feature, not a best-effort enhancement: a valid backup from an older supported backup schema must restore into the current app and finish on the current database schema after migrations/reconciliation have run.

---

## Phase 0: Compatibility Contract

Define the backup compatibility boundary before implementing flows.

Frozen decisions:

- Backup v1 uses a logical JSON backup document, not a raw SQLite database file copy.
- The user-facing file uses a custom `.owedbackup` extension with JSON contents.
- The filename pattern is `owed-backup-YYYY-MM-DD.owedbackup`.
- The backup document uses `manifest` and `payload`; storage-engine names such as `sqlite` do not appear in the backup contract.
- Payload collection names are domain-oriented camelCase names, with import/export mappers translating to concrete table and storage-key names.
- Implementation uses a small internal SDK, not scattered helper functions. App code imports `createBackupClient` and `createBackupFileClient` from the feature public surface.
- Public API names use generic backup terminology (`BackupClient`, `BackupDocument`, `BackupPayloadV1`) and do not repeat the app name. App identity remains data in the manifest and filename.
- Core backup logic is separated from Expo, SQLite, and UI concerns through ports and infrastructure adapters.
- Backup export reads raw SQLite table rows directly, table-by-table, instead of using UI summary repositories.
- Restore validates the backup identity, supported backup schema, and required sections before destructive confirmation.
- Restore does not perform manual domain/data integrity auditing of backed-up rows; transactional import and SQLite constraints are the integrity boundary.
- Restore does not run ad hoc data manipulation/backfill logic; defaulting and data-shape upgrades belong in the existing database migration stack.
- Restore imports rows in dependency order inside transactional SQLite work.
- Restore invalidates app query/UI state once after replacement and reconciliation.
- Seeded sample data is the performance gate for backup and restore responsiveness.

Deliverables:

- A backup metadata contract that identifies Owed backups, backup schema version, creation timestamp, and enough app/schema context to validate compatibility.
- A forward-restore policy: newer app versions restore older supported backups; older app versions may reject newer backups.
- A migration expectation: restore must complete with the local database at the current app schema, not stranded at the backed-up schema.
- A fixture policy: every future backup schema version and every future database migration must add or update restore fixtures.

Exit criteria:

- The implementation agent can tell which backups are valid, unsupported-newer, unsupported-older, malformed, or from another app.
- There is a clear place for old-backup compatibility tests to live.

---

## Phase 1: Data Inventory

Inventory every local state surface that must round-trip.

Frozen decisions:

- Backup v1 uses an explicit allowlist of persisted surfaces, not a dump of every available table or storage key.
- SQLite allowlist: `people`, `debts`, `payments`, `activity_events`, `reminders`, and `schema_migrations`.
- AsyncStorage allowlist: `settings` and `onboarding-complete`.
- Legacy pre-SQLite AsyncStorage keys (`debts`, `payments`, `people`) are excluded unless implementation discovery proves they are still actively used.
- OS notification permission is excluded.
- Existing scheduled notification IDs are not authoritative restore state; restore cancels current Owed notifications and reconciles schedules after import.

Required scope:

- SQLite user data: people, debts, payments, activity events, reminders, and migration/schema state as needed for compatibility.
- Persisted settings: currency, theme preference, brand color, default reminder time, overdue reminder setting, and notification prompt state.
- Onboarding completion state.

Out of scope:

- OS notification permission.
- Cloud provider state.
- User accounts.
- Automatic backup history.

Exit criteria:

- The implementation has one authoritative data inventory.
- Tests can prove each inventory item is present in a backup and restored correctly.

---

## Phase 2: Backup Creation

Build the user-initiated backup path from Settings -> Data -> Backup Data.

Expected behavior:

- Backup runs locally and offline.
- Backup produces one file using the `owed-backup-YYYY-MM-DD` naming pattern.
- User chooses the storage destination through the operating system.
- Owed never uploads backup files.
- Success confirmation is lightweight.

Exit criteria:

- A backup created from an empty app is valid.
- A backup created from a populated app contains all required local state.
- Backup cancellation or file-save failure does not mutate app data.

---

## Phase 3: Restore Pipeline

Build restore as a staged pipeline: choose file, validate, confirm replacement, replace state, migrate/reconcile, refresh app.

Required behavior:

- Invalid files are rejected before destructive replacement.
- The destructive confirmation appears after validation and before replacement.
- Canceling at any point before confirmation leaves current data unchanged.
- Restore replacement is atomic from the user's perspective: a failed restore must not leave mixed current/restored data.
- If row data fails during import, restore fails and rolls back without replacing the current app state.
- Valid empty backups are restorable after confirmation.
- Restored state preserves backed-up onboarding and settings.
- Existing scheduled Owed notifications are canceled, restored reminders are reconciled, and stale notifications do not survive restore.
- The app immediately reflects restored data after restore completes.

Migration requirement:

- Restoring a backup from an older supported backup/database shape must run through the migration path and finish compatible with the current app.
- If restored data needs defaults, backfills, or schema-shape changes, those changes must be represented as normal database migrations rather than restore-only transforms.
- Future migrations must not break historical restore fixtures.

Exit criteria:

- Restore succeeds for current-version backups.
- Restore succeeds for every supported older-backup fixture.
- Restore failure paths preserve pre-restore state.

---

## Phase 4: Settings UX

Replace the current Privacy export placeholder with the Data section from the PRD.

Expected Settings structure:

- Data
- Backup Data
- Restore Backup
- Delete All Data

Required copy:

- Helper: `Owed is local-first. Back up your data anytime for extra peace of mind.`
- Privacy note: `Your backups are created locally and stored wherever you choose. Owed never uploads your backup files.`
- Backup success: `Backup created` / `Your data has been saved successfully.`
- Restore confirmation: `Replace current data?` / `Restoring a backup will replace all current data in Owed. This action cannot be undone.`
- Restore success: `Backup restored` / `Your data has been restored successfully.`
- Invalid backup: `Backup not recognized` / `The selected file isn't a valid Owed backup.`

Exit criteria:

- Backup, restore, and delete all data are reachable from Settings -> Data.
- Restore uses destructive confirmation styling.
- User-facing errors avoid technical details.

---

## Phase 5: Test Matrix

This feature should not ship without dedicated tests for backup creation, restore, validation, migration compatibility, and failure behavior.

Backup tests:

- Empty app with default settings.
- Empty app with changed settings and onboarding state.
- Populated app with people, both debt directions, open debts, archived debts, payments, activity events, and reminders.
- Optional fields as null or empty: phone number, notes, reason, payment note, reminder fields.
- Special characters and long text in user-entered fields.
- Large local dataset aligned with [performance.md](./performance.md).
- User cancels destination picker/share flow.
- File creation or save failure.

Restore validation tests:

- Valid current backup.
- Valid empty backup.
- Valid older supported backup.
- Backup from a newer unsupported backup schema.
- Wrong app identifier.
- Missing metadata.
- Missing required local-state sections.
- Malformed file contents.

Restore behavior tests:

- User cancels file picker.
- User cancels destructive confirmation.
- Current data is unchanged after validation failure.
- Current data is unchanged after restore failure.
- Current data is unchanged if row import fails due to SQLite constraints.
- Current data is replaced after successful restore.
- Settings restore exactly.
- Onboarding state restores exactly.
- Query/UI state refreshes after restore.
- Existing scheduled Owed notifications are canceled.
- Reminder reconciliation runs after restored data is in place.
- Restore works without network access.

Migration compatibility tests:

- Every supported backup schema version restores into the latest app.
- Restored database ends at the current schema version.
- Restoring an older backup and then creating a new backup produces a latest-version backup.
- Future database migrations include a restore fixture or an explicit compatibility assertion.
- Future backup schema migrations include tests for old-to-current restore.

Round-trip tests:

- Backup -> restore into an app with different existing data -> resulting state matches the backup.
- Backup -> restore -> backup again preserves equivalent user state.
- Restore failure never produces mixed old/new local state.

Privacy and safety tests:

- Backup and restore paths do not require network.
- Sensitive backup contents are not logged.
- Temporary files do not become the user's only backup.
- User-facing errors remain non-technical.

Manual verification:

- iOS native destination flow.
- Android native destination flow.
- Restore from local device storage.
- Restore from a provider-backed file location when available.
- Settings -> Developer -> Seed sample data, then backup and restore.

---

## Phase 6: Release Gate

The feature is complete only when:

- All PRD success criteria pass.
- All frozen decisions are represented in behavior and tests.
- Historical backup fixtures restore on the current app.
- The migration path is covered by tests and documented expectations.
- Invalid backups fail gracefully before data replacement.
- Failed restores preserve current local state.
- No network, account, or cloud service is required.
