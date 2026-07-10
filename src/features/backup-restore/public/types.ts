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
};

export type BackupFile = {
  uri: string;
  name: string;
  sizeBytes: number;
  summary: BackupSummary;
};

export type BackupFileClient = {
  createFile(options?: CreateBackupOptions): Promise<BackupFile>;
  share(file: BackupFile): Promise<void>;
  inspectFile(uri: string): Promise<BackupInspection>;
};

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
