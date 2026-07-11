import { z } from "zod";

export const CURRENT_BACKUP_FORMAT_VERSION = 1;
export const BACKUP_FORMAT = "owed.backup";
export const BACKUP_SDK_VERSION = "1.0.0";
export const BACKUP_FILE_EXTENSION = "owedbackup";
export const BACKUP_MIME_TYPE = "application/json";

const nullableString = z.string().nullable();
const backupRowId = z.string().min(1);
const isoDateTime = z.string().datetime({ offset: true });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const backupPreferencesV1Schema = z.object({
  settings: z.record(z.string(), z.unknown()),
  onboardingComplete: z.boolean(),
});

export const backupPayloadV1Schema = z.object({
  people: z.array(
    z.object({
      id: backupRowId,
      name: z.string(),
      phoneNumber: nullableString,
      notes: nullableString,
      createdAt: isoDateTime,
      updatedAt: isoDateTime,
    }),
  ),
  debts: z.array(
    z.object({
      id: backupRowId,
      personId: backupRowId,
      originalAmount: z.number().int().nonnegative(),
      currency: z.string().min(1),
      reason: nullableString,
      dueDate: isoDate,
      lentDate: isoDate.nullable(),
      reminderEnabled: z.boolean(),
      reminderTime: nullableString,
      archivedAt: isoDateTime.nullable(),
      createdAt: isoDateTime,
      updatedAt: isoDateTime,
      direction: z.enum(["they_owe_me", "i_owe_them"]),
    }),
  ),
  payments: z.array(
    z.object({
      id: backupRowId,
      debtId: backupRowId,
      amount: z.number().int().positive(),
      paidAt: isoDateTime,
      note: nullableString,
      createdAt: isoDateTime,
    }),
  ),
  activityEvents: z.array(
    z.object({
      id: backupRowId,
      type: z.string().min(1),
      debtId: backupRowId,
      paymentId: nullableString,
      personId: backupRowId,
      amount: z.number().int().nonnegative().nullable(),
      occurredAt: isoDateTime,
      createdAt: isoDateTime,
    }),
  ),
  reminders: z.array(
    z.object({
      id: backupRowId,
      debtId: backupRowId,
      type: z.enum(["due", "overdue"]),
      remindAt: isoDateTime,
      status: z.enum(["scheduled", "sent", "cancelled"]),
      readAt: isoDateTime.nullable(),
      createdAt: isoDateTime,
      updatedAt: isoDateTime,
      groupKey: nullableString,
      archivedAt: isoDateTime.nullable(),
    }),
  ),
  preferences: backupPreferencesV1Schema,
});

export type BackupPayloadV1 = z.infer<typeof backupPayloadV1Schema>;
export type BackupPreferencesV1 = z.infer<typeof backupPreferencesV1Schema>;

export type BackupRecordCounts = {
  people: number;
  debts: number;
  payments: number;
  activityEvents: number;
  reminders: number;
};

export function suggestBackupFileName(createdAt: string): string {
  const timestamp = new Date(createdAt).toISOString().replace(/[:.]/g, "-");
  return `owed-backup-${timestamp}.${BACKUP_FILE_EXTENSION}`;
}

export function calculateRecordCounts(payload: BackupPayloadV1): BackupRecordCounts {
  return {
    people: payload.people.length,
    debts: payload.debts.length,
    payments: payload.payments.length,
    activityEvents: payload.activityEvents.length,
    reminders: payload.reminders.length,
  };
}
