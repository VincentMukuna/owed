# Backup Restore SDK

This feature is implemented as a small internal SDK. App code should use the public clients and avoid reaching into domain, adapter, or codec internals.

## Public API

Import from the feature root:

```ts
import { createBackupClient, createBackupFileClient } from "@/features/backup-restore";
```

Create a programmatic backup:

```ts
const backup = createBackupClient();
const created = await backup.create();

console.log(created.summary);
console.log(created.bytes);
```

Create and share a backup file:

```ts
const files = createBackupFileClient();
const file = await files.createFile();

await files.share(file);
```

Inspect a backup without modifying app data:

```ts
const backup = createBackupClient();
const inspection = await backup.inspect(bytes);

console.log(inspection.summary);
console.log(inspection.compatibility);
```

Prepare and commit a restore:

```ts
const backup = createBackupClient();
const prepared = await backup.prepareRestore(bytes);

console.log(prepared.plan);

await prepared.commit({
  createSafetyBackup: true,
  allowWarnings: true,
});
```

Restore from a picked file:

```ts
const files = createBackupFileClient();
const file = await files.pickFile();

if (file) {
  const prepared = await files.prepareRestoreFile(file.uri);
  await prepared.commit({ allowWarnings: true });
}
```

## Architecture

```text
backup-restore/
├── public/          # Factories and stable app-facing types
├── domain/          # Backup document, payload, errors, summaries
├── application/     # Backup client, file client, prepared restore operation
├── ports/           # Interfaces for source, destination, codec, integrity, files, hooks
├── infrastructure/  # SQLite, Expo, JSON, SHA-256, validation, restore hooks
├── __fixtures__/    # Compatibility fixtures
└── __tests__/       # SDK behavior tests
```

The important boundary: the core application layer depends on ports, not Expo, SQLite, React, navigation, or UI code.

## Backup Document

Backup files are JSON documents with:

```ts
type BackupDocument = {
  manifest: BackupManifest;
  payload: BackupPayloadV1;
};
```

The manifest contains identity, format version, producer app metadata, source schema metadata, record counts, and SHA-256 integrity data.

The payload is domain-oriented:

```ts
type BackupPayloadV1 = {
  people: PersonBackupRecord[];
  debts: DebtBackupRecord[];
  payments: PaymentBackupRecord[];
  activityEvents: ActivityEventBackupRecord[];
  reminders: ReminderBackupRecord[];
  preferences: BackupPreferencesV1;
};
```

Do not expose SQLite table names, indexes, row IDs, notification IDs, query cache state, navigation state, or temporary file paths in the portable backup format.

## Restore Flow

Restores are two-phase:

1. `prepareRestore(input)` decodes, validates, verifies integrity, inspects compatibility, and builds a restore plan.
2. `prepared.commit()` creates a safety backup by default, replaces local state, and runs post-restore hooks.

`prepareRestore()` must not modify app data.

`commit()` is one-shot. A disposed or already-committed prepared restore cannot be committed again.

## Data Replacement

`SQLiteBackupAdapter.replaceSnapshot()` owns database replacement. It translates domain payload records into current SQLite rows and performs destructive replacement inside an exclusive SQLite transaction.

The restore layer does not run ad hoc data repair or backfill logic. Schema-shape changes and defaults belong in the normal database migration stack.

## Post-Restore Hooks

Post-restore hooks currently:

- cancel and reconcile reminder notifications
- invalidate React Query caches

Hook failures do not roll back a completed database restore. They are returned as restore warnings so the app can surface or retry follow-up work.

## Extension Points

Future cloud or encrypted backups should plug into ports instead of changing app UI code:

- `BackupFileStore` for local, cloud, or remote storage
- `BackupCodec` for compression/encryption wrappers
- `BackupIntegrity` for different integrity implementations
- `BackupSource` / `BackupRestoreDestination` for different persistence engines
- `BackupRestoreHook` for widgets, analytics-safe local refreshes, or other post-restore work

## Testing

Run:

```sh
npm test
```

Compatibility fixtures live in `__fixtures__`. Any future backup format version or database migration that affects restore compatibility should add or update fixtures.
