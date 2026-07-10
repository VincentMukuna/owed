import { z } from "zod";

export const OWED_BACKUP_APP_ID = "owed";
export const CURRENT_BACKUP_SCHEMA_VERSION = 1;

const isoDateTimeSchema = z.string().datetime({ offset: true });
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nullableStringSchema = z.string().nullable();
const sqliteBooleanSchema = z.union([z.literal(0), z.literal(1)]);

const metadataSchema = z.object({
  appId: z.literal(OWED_BACKUP_APP_ID),
  backupSchemaVersion: z.number().int().positive().max(CURRENT_BACKUP_SCHEMA_VERSION),
  createdAt: isoDateTimeSchema,
  appVersion: z.string().min(1),
  databaseSchemaVersion: z.number().int().nonnegative(),
});

const personRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone_number: nullableStringSchema,
  notes: nullableStringSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

const debtRowSchema = z.object({
  id: z.string().min(1),
  person_id: z.string().min(1),
  original_amount: z.number().int().nonnegative(),
  currency: z.string().length(3),
  reason: nullableStringSchema,
  due_date: isoDateSchema,
  lent_date: isoDateSchema.nullable(),
  reminder_enabled: sqliteBooleanSchema,
  reminder_time: nullableStringSchema,
  archived_at: isoDateTimeSchema.nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  direction: z.enum(["they_owe_me", "i_owe_them"]),
});

const paymentRowSchema = z.object({
  id: z.string().min(1),
  debt_id: z.string().min(1),
  amount: z.number().int().positive(),
  paid_at: isoDateSchema,
  note: nullableStringSchema,
  created_at: isoDateTimeSchema,
});

const activityEventRowSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  debt_id: z.string().min(1),
  payment_id: nullableStringSchema,
  person_id: z.string().min(1),
  amount: z.number().int().nonnegative().nullable(),
  occurred_at: isoDateTimeSchema,
  created_at: isoDateTimeSchema,
});

const reminderRowSchema = z.object({
  id: z.string().min(1),
  debt_id: z.string().min(1),
  type: z.enum(["due", "overdue"]),
  remind_at: isoDateTimeSchema,
  status: z.enum(["scheduled", "sent", "cancelled"]),
  notification_id: nullableStringSchema,
  read_at: isoDateTimeSchema.nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  group_key: nullableStringSchema,
  archived_at: isoDateTimeSchema.nullable(),
});

const schemaMigrationRowSchema = z.object({
  version: z.number().int().positive(),
});

const settingsSchema = z.object({
  defaultCurrency: z.string().length(3).optional(),
  themePreference: z.enum(["auto", "light", "dark"]).optional(),
  brandColorTheme: z.string().min(1).optional(),
  defaultReminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  overdueReminderEnabled: z.boolean().optional(),
  notificationsPermissionAsked: z.boolean().optional(),
});

export const backupEnvelopeSchema = z.object({
  metadata: metadataSchema,
  data: z.object({
    sqlite: z.object({
      people: z.array(personRowSchema),
      debts: z.array(debtRowSchema),
      payments: z.array(paymentRowSchema),
      activity_events: z.array(activityEventRowSchema),
      reminders: z.array(reminderRowSchema),
      schema_migrations: z.array(schemaMigrationRowSchema),
    }),
    settings: settingsSchema,
    onboardingComplete: z.boolean(),
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
