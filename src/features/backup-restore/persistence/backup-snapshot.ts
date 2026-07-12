import type { BackupPayloadV1, BackupRecordCounts } from "../domain/backup-payload-v1";

export type BackupOperationContext = {
  signal?: AbortSignal;
};

export type BackupSnapshotMetadata = {
  databaseSchemaVersion: number;
};

export type BackupSnapshot = {
  getMetadata(): Promise<BackupSnapshotMetadata>;
  exportSnapshot(context: BackupOperationContext): Promise<BackupPayloadV1>;
  getCurrentRecordCounts(): Promise<BackupRecordCounts>;
  replaceSnapshot(
    payload: BackupPayloadV1,
    context: BackupOperationContext,
  ): Promise<BackupRecordCounts>;
};
