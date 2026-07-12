import type {
  BackupCompatibility,
  BackupDocument,
  BackupInspection,
  BackupManifest,
  BackupSummary,
  BackupWarning,
} from "../domain/backup-document";
import type { BackupFailure } from "../domain/backup-error";
import type { BackupPayloadV1, BackupRecordCounts } from "../domain/backup-payload-v1";

export type BackupInput = Uint8Array | string | BackupDocument;

export type CreateBackupOptions = {
  metadata?: Record<string, string>;
  signal?: AbortSignal;
};

export type CreatedBackup = {
  document: BackupDocument<BackupPayloadV1>;
  bytes: Uint8Array;
  summary: BackupSummary;
};

export type RestorePlan = {
  mode: "replace";
  deleteCounts: BackupRecordCounts;
  insertCounts: BackupRecordCounts;
  postRestoreActions: string[];
};

export type PrepareRestoreOptions = {
  signal?: AbortSignal;
};

export type CommitRestoreOptions = {
  createSafetyBackup?: boolean;
  allowWarnings?: boolean;
  signal?: AbortSignal;
};

export type RestoreOptions = PrepareRestoreOptions & CommitRestoreOptions;

export type RestoreResult = {
  status: "restored";
  restoredAt: string;
  source: BackupSummary;
  restoredCounts: BackupRecordCounts;
  safetyBackup?: CreatedBackup;
  warnings: BackupWarning[];
};

export type PreparedRestore = {
  readonly inspection: BackupInspection;
  readonly plan: RestorePlan;
  commit(options?: CommitRestoreOptions): Promise<RestoreResult>;
  dispose(): void;
};

export type CanRestoreResult = {
  canRestore: boolean;
  summary?: BackupSummary;
  warnings: BackupWarning[];
  error?: BackupFailure;
};

export type BackupClient = {
  create(options?: CreateBackupOptions): Promise<CreatedBackup>;
  encode(backup: BackupDocument): Promise<Uint8Array>;
  inspect(input: BackupInput): Promise<BackupInspection>;
  canRestore(input: BackupInput): Promise<CanRestoreResult>;
  prepareRestore(input: BackupInput, options?: PrepareRestoreOptions): Promise<PreparedRestore>;
  restore(input: BackupInput, options?: RestoreOptions): Promise<RestoreResult>;
};

export type { BackupStore, StoredBackup, StoredBackupInfo } from "../files/backup-store";

export type {
  BackupCompatibility,
  BackupDocument,
  BackupFailure,
  BackupInspection,
  BackupManifest,
  BackupPayloadV1,
  BackupRecordCounts,
  BackupSummary,
  BackupWarning,
};
