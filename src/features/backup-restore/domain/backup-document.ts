import { z } from "zod";

import { BackupError } from "./backup-error";
import {
  BACKUP_FORMAT,
  BACKUP_SDK_VERSION,
  type BackupPayloadV1,
  type BackupRecordCounts,
  CURRENT_BACKUP_FORMAT_VERSION,
  backupPayloadV1Schema,
} from "./backup-payload-v1";

export type BackupManifest = {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  backupId: string;
  createdAt: string;
  producer: {
    appId: string;
    appVersion: string;
    buildVersion: string | null;
    sdkVersion: typeof BACKUP_SDK_VERSION;
  };
  source: {
    databaseSchemaVersion: number;
  };
  payload: {
    encoding: "json";
    hashAlgorithm: "sha256";
    hash: string;
    byteLength: number;
    counts: BackupRecordCounts;
  };
  metadata?: Record<string, string>;
};

export type BackupDocument<TPayload = BackupPayloadV1> = {
  manifest: BackupManifest;
  payload: TPayload;
};

export type BackupSummary = {
  backupId: string;
  createdAt: string;
  formatVersion: number;
  appVersion: string;
  counts: BackupRecordCounts;
};

export type BackupCompatibility = {
  canRestore: boolean;
  requiresMigration: boolean;
  sourceFormatVersion: number;
  targetFormatVersion: number;
};

export type BackupInspection<TPayload = BackupPayloadV1> = {
  valid: true;
  originalManifest: BackupManifest;
  normalizedManifest: BackupManifest;
  payload: TPayload;
  summary: BackupSummary;
  compatibility: BackupCompatibility;
  warnings: BackupWarning[];
};

export type BackupWarning = {
  code: "EMPTY_BACKUP" | "BACKUP_FROM_OLDER_APP" | "POST_RESTORE_HOOK_FAILED";
  message: string;
  details?: Record<string, unknown>;
};

const recordCountsSchema = z.object({
  people: z.number().int().nonnegative(),
  debts: z.number().int().nonnegative(),
  payments: z.number().int().nonnegative(),
  activityEvents: z.number().int().nonnegative(),
  reminders: z.number().int().nonnegative(),
});

export const backupManifestSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  formatVersion: z.number().int().positive().max(CURRENT_BACKUP_FORMAT_VERSION),
  backupId: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  producer: z.object({
    appId: z.string().min(1),
    appVersion: z.string().min(1),
    buildVersion: z.string().nullable(),
    sdkVersion: z.literal(BACKUP_SDK_VERSION),
  }),
  source: z.object({
    databaseSchemaVersion: z.number().int().nonnegative(),
  }),
  payload: z.object({
    encoding: z.literal("json"),
    hashAlgorithm: z.literal("sha256"),
    hash: z.string().min(1),
    byteLength: z.number().int().nonnegative(),
    counts: recordCountsSchema,
  }),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const backupDocumentSchema = z.object({
  manifest: backupManifestSchema,
  payload: backupPayloadV1Schema,
});

export function createBackupSummary(manifest: BackupManifest): BackupSummary {
  return {
    backupId: manifest.backupId,
    createdAt: manifest.createdAt,
    formatVersion: manifest.formatVersion,
    appVersion: manifest.producer.appVersion,
    counts: manifest.payload.counts,
  };
}

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

export function validateBackupDocument(input: unknown): BackupDocument {
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

export function validateBackupManifest(input: unknown): BackupManifest {
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

export function validateBackupPayload(input: unknown): BackupPayloadV1 {
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
