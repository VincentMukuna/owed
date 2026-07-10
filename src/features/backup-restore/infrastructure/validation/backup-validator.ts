import {
  type BackupDocument,
  type BackupManifest,
  backupDocumentSchema,
  backupManifestSchema,
} from "../../domain/backup-document";
import { BackupError } from "../../domain/backup-error";
import { type BackupPayloadV1, backupPayloadV1Schema } from "../../domain/backup-payload-v1";
import type { BackupValidator } from "../../ports/backup-validator";

type ZodIssueLike = {
  path: PropertyKey[];
  message: string;
  code: string;
};

function formatIssuePath(path: PropertyKey[]): string {
  return path.length > 0 ? path.map(String).join(".") : "<root>";
}

function summarizeIssues(issues: ZodIssueLike[]): string[] {
  return issues.slice(0, 8).map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`);
}

function validationErrorMessage(label: string, issues: ZodIssueLike[]): string {
  const summary = summarizeIssues(issues);
  if (summary.length === 0) {
    return `${label} is not valid.`;
  }

  return `${label} is not valid: ${summary.join("; ")}`;
}

function validationErrorDetails(issues: ZodIssueLike[]): Record<string, unknown> {
  return {
    issues: issues.map((issue) => ({
      path: formatIssuePath(issue.path),
      code: issue.code,
      message: issue.message,
    })),
  };
}

export class ZodBackupValidator implements BackupValidator<BackupPayloadV1> {
  validateDocument(input: unknown): BackupDocument<BackupPayloadV1> {
    const parsed = backupDocumentSchema.safeParse(input);

    if (!parsed.success) {
      throw new BackupError(
        "INVALID_DOCUMENT",
        validationErrorMessage("The backup document", parsed.error.issues),
        parsed.error,
        validationErrorDetails(parsed.error.issues),
      );
    }

    return parsed.data;
  }

  validateManifest(input: unknown): BackupManifest {
    const parsed = backupManifestSchema.safeParse(input);

    if (!parsed.success) {
      throw new BackupError(
        "INVALID_MANIFEST",
        validationErrorMessage("The backup manifest", parsed.error.issues),
        parsed.error,
        validationErrorDetails(parsed.error.issues),
      );
    }

    return parsed.data;
  }

  validateCurrentPayload(input: unknown): BackupPayloadV1 {
    const parsed = backupPayloadV1Schema.safeParse(input);

    if (!parsed.success) {
      throw new BackupError(
        "INVALID_PAYLOAD",
        validationErrorMessage("The backup payload", parsed.error.issues),
        parsed.error,
        validationErrorDetails(parsed.error.issues),
      );
    }

    return parsed.data;
  }
}
