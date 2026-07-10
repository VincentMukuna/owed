import { z } from "zod";

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
