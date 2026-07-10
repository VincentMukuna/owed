import type { BackupDocument, BackupManifest } from "../domain/backup-document";

export type BackupValidator<TPayload> = {
  validateDocument(input: unknown): BackupDocument<TPayload>;
  validateManifest(input: unknown): BackupManifest;
  validateCurrentPayload(input: unknown): TPayload;
};
