export { createBackupClient, createBackupFileClient } from "./public/factories";
export { BackupError } from "./domain/backup-error";

export type {
  BackupClient,
  BackupCompatibility,
  BackupDocument,
  BackupFailure,
  BackupFile,
  BackupFileClient,
  BackupInput,
  BackupInspection,
  BackupManifest,
  BackupPayloadV1,
  BackupRecordCounts,
  BackupSummary,
  BackupWarning,
  CanRestoreResult,
  CreatedBackup,
  CreateBackupOptions,
} from "./public/types";
