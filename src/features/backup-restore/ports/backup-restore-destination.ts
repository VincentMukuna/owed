import type { BackupPayloadV1, BackupRecordCounts } from "../domain/backup-payload-v1";
import type { BackupOperationContext } from "./backup-source";

export type BackupRestoreDestination<TPayload> = {
  getCurrentRecordCounts(): Promise<BackupRecordCounts>;
  replaceSnapshot(payload: TPayload, context: BackupOperationContext): Promise<BackupRecordCounts>;
};

export type BackupRestoreHookContext = {
  restoredCounts: BackupRecordCounts;
};

export type BackupRestoreHook = {
  readonly name: string;
  afterRestore(context: BackupRestoreHookContext): Promise<void>;
};

export type BackupPayloadRestoreDestination = BackupRestoreDestination<BackupPayloadV1>;
