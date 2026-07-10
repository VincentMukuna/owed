import { z } from "zod";

export const OWED_BACKUP_APP_ID = "owed";
export const CURRENT_BACKUP_SCHEMA_VERSION = 1;

const isoDateTimeSchema = z.string().datetime({ offset: true });
const backupRowSchema = z.record(z.string(), z.unknown());

const metadataSchema = z.object({
  appId: z.literal(OWED_BACKUP_APP_ID),
  backupSchemaVersion: z.number().int().positive().max(CURRENT_BACKUP_SCHEMA_VERSION),
  createdAt: isoDateTimeSchema,
  appVersion: z.string().min(1),
  databaseSchemaVersion: z.number().int().nonnegative(),
});

export const backupEnvelopeSchema = z.object({
  metadata: metadataSchema,
  data: z.object({
    database: z.object({
      people: z.array(backupRowSchema),
      debts: z.array(backupRowSchema),
      payments: z.array(backupRowSchema),
      activityEvents: z.array(backupRowSchema),
      reminders: z.array(backupRowSchema),
      schemaMigrations: z.array(backupRowSchema),
    }),
    preferences: z.object({
      settings: z.record(z.string(), z.unknown()),
      onboardingComplete: z.boolean(),
    }),
  }),
});

export type BackupEnvelope = z.infer<typeof backupEnvelopeSchema>;

export type BackupValidationResult =
  | { ok: true; backup: BackupEnvelope }
  | {
      ok: false;
      reason: "malformed" | "wrong-app" | "unsupported-newer-schema";
    };

export function validateBackupEnvelope(input: unknown): BackupValidationResult {
  const raw = z
    .object({
      metadata: z
        .object({
          appId: z.unknown(),
          backupSchemaVersion: z.unknown(),
        })
        .passthrough(),
    })
    .passthrough()
    .safeParse(input);

  if (!raw.success) {
    return { ok: false, reason: "malformed" };
  }

  if (raw.data.metadata.appId !== OWED_BACKUP_APP_ID) {
    return { ok: false, reason: "wrong-app" };
  }

  if (
    typeof raw.data.metadata.backupSchemaVersion === "number" &&
    raw.data.metadata.backupSchemaVersion > CURRENT_BACKUP_SCHEMA_VERSION
  ) {
    return { ok: false, reason: "unsupported-newer-schema" };
  }

  const parsed = backupEnvelopeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "malformed" };
  }

  return { ok: true, backup: parsed.data };
}
