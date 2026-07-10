import {
  type BackupDocument,
  type BackupManifest,
  backupDocumentSchema,
  backupManifestSchema,
} from "../../domain/backup-document";
import { BackupError } from "../../domain/backup-error";
import { type BackupPayloadV1, backupPayloadV1Schema } from "../../domain/backup-payload-v1";
import type { BackupValidator } from "../../ports/backup-validator";

export class ZodBackupValidator implements BackupValidator<BackupPayloadV1> {
  validateDocument(input: unknown): BackupDocument<BackupPayloadV1> {
    const parsed = backupDocumentSchema.safeParse(input);

    if (!parsed.success) {
      throw new BackupError("INVALID_DOCUMENT", "The backup document is not valid.", parsed.error);
    }

    return parsed.data;
  }

  validateManifest(input: unknown): BackupManifest {
    const parsed = backupManifestSchema.safeParse(input);

    if (!parsed.success) {
      throw new BackupError("INVALID_MANIFEST", "The backup manifest is not valid.", parsed.error);
    }

    return parsed.data;
  }

  validateCurrentPayload(input: unknown): BackupPayloadV1 {
    const parsed = backupPayloadV1Schema.safeParse(input);

    if (!parsed.success) {
      throw new BackupError("INVALID_PAYLOAD", "The backup payload is not valid.", parsed.error);
    }

    return parsed.data;
  }
}
