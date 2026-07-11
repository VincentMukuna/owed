# PRD: Backup & Restore

**Status:** Draft — needs grilling for unresolved product decisions  
**Scope:** Full local app backup and destructive restore  
**Branch:** `feature-export`  
**Positioning:** Local-first data ownership; this is not reporting export.

**Related docs**

| Document | Role |
|----------|------|
| [prd.md](./prd.md) | Original product vision |
| [persistence-prd.md](./persistence-prd.md) | SQLite persistence and repository boundaries |
| [reminders-prd.md](./reminders-prd.md) | Reminder settings, local notifications, and inbox behavior |
| [currency-prd.md](./currency-prd.md) | Persisted app currency and preference model |
| [performance.md](./performance.md) | Query invalidation and local data performance rules |
| [design-brief.md](./design-brief.md) | Calm, private, trustworthy UX tone |

---

## 1. Feature Summary

Backup & Restore allows users to safely back up their Owed data and restore it later.

The feature is designed for:

- Device migration
- Personal backups
- Peace of mind
- Recovering after accidental data loss

This is not an export or reporting feature.

Its purpose is to preserve the user's private data.

---

## 2. Product Positioning

Owed is local-first.

Users own their data.

Backup & Restore gives users complete control over that data without requiring an account or cloud sync.

Core promise:

> Your data stays yours.

---

## 3. Goals

The feature should allow users to:

- Create a backup of all app data.
- Save the backup anywhere supported by the operating system.
- Restore a backup at any time.
- Move their data between devices.
- Keep backups completely offline if they choose.

The feature should feel simple and trustworthy.

---

## 4. Non-Goals

This feature should not include:

- Automatic cloud sync
- Scheduled backups
- User accounts
- Online backup storage
- Merge backups
- Partial restore
- Version history
- Conflict resolution

The restore process should simply replace the current local data.

---

## 5. User Stories

### Backup

As a user, I want to save a backup of my Owed data so that I can recover it later or move it to another device.

### Restore

As a user, I want to restore a previous backup so that I can recover my information if I reinstall the app or switch phones.

---

## 6. Navigation

Settings -> Data

- Backup Data
- Restore Backup
- Delete All Data

---

## 7. Backup Flow

### Entry Point

Settings -> Backup Data

### Flow

1. User taps **Backup Data**.
2. Owed prepares a complete backup.
3. The native file picker/share sheet opens.
4. The user chooses where to save it.

Examples:

- Files
- iCloud Drive
- Google Drive
- Dropbox
- Local device storage

The backup process should complete without requiring an internet connection.

---

## 8. Backup Format

Use a single backup file.

The implementation format is up to the engineering layer.

The user should not need to understand the internal structure.

Recommended filename:

```text
owed-backup-YYYY-MM-DD
```

Example:

```text
owed-backup-2026-07-10
```

---

## 9. Backup Success

After a successful backup:

**Title:** Backup created

**Body:** Your data has been saved successfully.

**CTA:** Done

Keep this confirmation lightweight.

---

## 10. Restore Flow

### Entry Point

Settings -> Restore Backup

### Flow

1. User taps **Restore Backup**.
2. Native file picker opens.
3. User selects an Owed backup.
4. Owed validates the file.
5. User is warned that the current data will be replaced.
6. User confirms.
7. Restore completes.
8. App refreshes with restored data.

---

## 11. Restore Confirmation

Before restoring:

**Title:** Replace current data?

**Body:** Restoring a backup will replace all current data in Owed.

This action cannot be undone.

**Buttons:**

- Cancel
- Restore

Use a destructive confirmation style for the restore action.

---

## 12. Restore Success

**Title:** Backup restored

**Body:** Your data has been restored successfully.

The app should immediately reflect the restored information.

---

## 13. Invalid Backup

If the selected file is not a valid Owed backup:

**Title:** Backup not recognized

**Body:** The selected file isn't a valid Owed backup.

**CTA:** Choose another file

Avoid technical error messages.

---

## 14. Empty Backup

If the backup contains no user records and the user has not confirmed restore yet, the normal destructive restore confirmation still applies.

If the user confirms, Owed may restore the empty backup because an empty local dataset is a valid app state.

Do not show a separate empty-backup blocker for structurally valid backups.

---

## 15. Data Included

A backup should include everything needed to fully restore the user's app, including:

- Debts and promises
- People
- Payment history
- Categories
- Reminders
- App preferences
- Theme settings
- Brand color
- Currency
- Any other user-created content

The goal is a complete restoration of the user's experience.

---

## 16. Privacy

Backup files are never uploaded by Owed.

Suggested copy:

> Your backups are created locally and stored wherever you choose. Owed never uploads your backup files.

---

## 17. Settings Copy

### Data

Manage your local data.

Rows:

- Backup Data
- Restore Backup
- Delete All Data

Helper text:

> Owed is local-first. Back up your data anytime for extra peace of mind.

---

## 18. UX Principles

- Simple
- Local-first
- No account required
- No internet required
- Fast
- Clear confirmations
- Friendly language
- No technical jargon

Users should feel confident that their data is safe and portable.

---

## 19. Future Enhancements

Not part of this version:

- Automatic scheduled backups
- Encrypted backups with a password
- Cloud sync
- Backup history
- Incremental backups
- Multiple restore points
- Cross-platform sync

---

## 20. Success Criteria

The feature is complete when:

- Users can create a full backup in a few taps.
- Users can restore a backup from a file.
- Current data is clearly replaced after confirmation.
- Invalid backups are handled gracefully.
- No account or internet connection is required.
- The experience feels simple, private, and trustworthy.

---

## 21. Current Implementation Context

Owed currently stores local app data in two places:

| Store | Current contents |
|-------|------------------|
| SQLite (`owed.db`) | `people`, `debts`, `payments`, `activity_events`, `reminders`, schema migrations |
| AsyncStorage (`@owed/*`) | Settings, onboarding completion, and historical storage keys |

For a complete restoration of the user's experience, backup must cover:

- The complete user SQLite dataset, including reminder inbox rows.
- Persisted settings from `storageKeys.settings`: currency, theme preference, brand color, reminder defaults, overdue notification setting, and notification permission prompt state.
- Onboarding completion from `storageKeys.onboardingComplete`.

System-level notification permissions cannot be restored as user data. During restore, Owed should cancel current scheduled Owed notifications, replace local data, refresh local queries, and reconcile reminders using the existing reminder sync flow.

---

## 22. Open Decisions

No open product decisions remain from this draft. See frozen decisions below.

---

## 23. Frozen Design Decisions

Agreed via grilling. Do not re-litigate without product sign-off.

| # | Topic | Decision |
|---|-------|----------|
| D1 | Backup file compatibility | Newer app versions can restore older backups. Backup files include a backup schema version; restore migrates old backups forward. Older app versions may reject newer backups. |
| D2 | Backup integrity | v1 uses structured validation plus backup metadata: `appId`, backup schema version, created timestamp, required tables/keys, and row shapes. No cryptographic signing or checksum in v1. |
| D3 | Empty backup semantics | A structurally valid empty backup can be restored after the normal destructive confirmation. Empty local data is a valid app state, especially when migrating preferences. |
| D4 | Onboarding state | Preserve the backed-up onboarding completion state as part of full app-state restore. No special onboarding rule after restore. |
| D5 | Existing notifications | Restore cancels current scheduled Owed notifications, replaces data, then runs reminder sync so restored reminder state is reflected without stale notifications. OS notification permission is unchanged. |
