# Backup Restore SDK

This feature is implemented as a small internal SDK. App code should use the public clients and avoid reaching into domain, persistence, or codec internals.

## Public API

Import from the feature root:

```ts
import { createBackupClient, createBackupStore } from "@/features/backup-restore";
```

Create a programmatic backup:

```ts
const backups = createBackupClient();
const created = await backups.create();

console.log(created.summary);
console.log(created.bytes);
```

Write a backup file and share it (sharing is composed by the caller):

```ts
import * as Sharing from "expo-sharing";

import {
  BACKUP_MIME_TYPE,
  createBackupClient,
  createBackupStore,
  suggestBackupFileName,
} from "@/features/backup-restore";

const backups = createBackupClient();
const store = createBackupStore();

const created = await backups.create();
const file = await store.write(suggestBackupFileName(created.summary.createdAt), created.bytes);

await Sharing.shareAsync(file.uri, {
  dialogTitle: "Save Owwed backup",
  mimeType: BACKUP_MIME_TYPE,
});
```

Inspect a backup without modifying app data:

```ts
const backups = createBackupClient();
const inspection = await backups.inspect(bytes);

console.log(inspection.summary);
console.log(inspection.compatibility);
```

Prepare and commit a restore:

```ts
const backups = createBackupClient();
const prepared = await backups.prepareRestore(bytes);

console.log(prepared.plan);

await prepared.commit({
  createSafetyBackup: true,
  allowWarnings: true,
});
```

Restore from a picked file:

```ts
const backups = createBackupClient();
const store = createBackupStore();
const file = await store.pick();

if (file) {
  const prepared = await backups.prepareRestore(await store.read(file.uri));
  await prepared.commit({ allowWarnings: true });
}
```

## Architecture

```text
backup-restore/
├── public/          # Factories and stable app-facing types
├── domain/          # Backup document, payload, validation, integrity, errors
├── client/          # Backup client and prepared restore operation
├── persistence/     # BackupSnapshot interface and SQLite adapter
├── files/           # BackupStore, JSON codec, Expo file I/O
├── __fixtures__/    # Compatibility fixtures
└── __tests__/       # SDK behavior tests
```

The important boundary: the client module depends on persistence and files seams, not Expo UI, navigation, or screen code. Post-restore side effects are wired as callbacks in `createBackupClient()`.

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
2. `prepared.commit()` creates a safety backup by default, replaces local state, and runs post-restore actions.

`prepareRestore()` must not modify app data.

`commit()` is one-shot. A disposed or already-committed prepared restore cannot be committed again.

## Data Replacement

`SQLiteBackupAdapter.replaceSnapshot()` owns database replacement. It translates domain payload records into current SQLite rows and performs destructive replacement inside an exclusive SQLite transaction.

The restore layer does not run ad hoc data repair or backfill logic. Schema-shape changes and defaults belong in the normal database migration stack.

## Post-Restore Actions

Post-restore actions are registered in `createBackupClient()` and currently:

- cancel and reconcile reminder notifications
- invalidate React Query caches

Action failures do not roll back a completed database restore. They are returned as restore warnings so the app can surface or retry follow-up work.

## Extension Points

Future cloud or encrypted backups should plug into seams instead of changing app UI code:

- `BackupStore` for local, cloud, or remote blob storage
- `BackupCodec` for compression/encryption wrappers
- `BackupSnapshot` for different persistence engines
- `afterRestore` callbacks in `createBackupClient()` for widgets, analytics-safe local refreshes, or other post-restore work

## Testing

Run:

```sh
npm test
```

Compatibility fixtures live in `__fixtures__`. Any future backup format version or database migration that affects restore compatibility should add or update fixtures.
