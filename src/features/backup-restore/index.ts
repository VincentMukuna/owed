export { createBackupClient, createBackupStore } from "./public/factories";
export { BackupError } from "./domain/backup-error";
export { BACKUP_MIME_TYPE, suggestBackupFileName } from "./domain/backup-payload-v1";

export type {
  BackupClient,
  BackupCompatibility,
  BackupDocument,
  BackupFailure,
  BackupInput,
  BackupInspection,
  BackupManifest,
  BackupPayloadV1,
  BackupRecordCounts,
  BackupStore,
  BackupSummary,
  BackupWarning,
  CanRestoreResult,
  CommitRestoreOptions,
  CreatedBackup,
  CreateBackupOptions,
  PreparedRestore,
  PrepareRestoreOptions,
  RestoreOptions,
  RestorePlan,
  RestoreResult,
  StoredBackup,
  StoredBackupInfo,
} from "./public/types";
