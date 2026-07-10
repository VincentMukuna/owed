import { isOnboardingComplete } from "@/features/onboarding/lib/onboarding-storage";
import { loadPersistedSettings } from "@/features/reminders/lib/reminder-storage";

import type { BackupPayloadV1 } from "../../domain/backup-payload-v1";
import type {
  BackupOperationContext,
  BackupSource,
  BackupSourceMetadata,
} from "../../ports/backup-source";

type BackupDatabaseConnection = {
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
};

type PersonRow = {
  id: string;
  name: string;
  phone_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DebtRow = {
  id: string;
  person_id: string;
  original_amount: number;
  currency: string;
  reason: string | null;
  due_date: string;
  lent_date: string | null;
  reminder_enabled: number;
  reminder_time: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  direction: "they_owe_me" | "i_owe_them";
};

type PaymentRow = {
  id: string;
  debt_id: string;
  amount: number;
  paid_at: string;
  note: string | null;
  created_at: string;
};

type ActivityEventRow = {
  id: string;
  type: string;
  debt_id: string;
  payment_id: string | null;
  person_id: string;
  amount: number | null;
  occurred_at: string;
  created_at: string;
};

type ReminderRow = {
  id: string;
  debt_id: string;
  type: "due" | "overdue";
  remind_at: string;
  status: "scheduled" | "sent" | "cancelled";
  read_at: string | null;
  created_at: string;
  updated_at: string;
  group_key: string | null;
  archived_at: string | null;
};

export class SQLiteBackupAdapter implements BackupSource<BackupPayloadV1> {
  constructor(private readonly getDb: () => Promise<BackupDatabaseConnection>) {}

  async getSourceMetadata(): Promise<BackupSourceMetadata> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ version: number | null }>(
      "SELECT MAX(version) AS version FROM schema_migrations",
    );

    return {
      databaseSchemaVersion: row?.version ?? 0,
    };
  }

  async exportSnapshot(_context: BackupOperationContext): Promise<BackupPayloadV1> {
    const [people, debts, payments, activityEvents, reminders, settings, onboardingComplete] =
      await Promise.all([
        this.readPeople(),
        this.readDebts(),
        this.readPayments(),
        this.readActivityEvents(),
        this.readReminders(),
        loadPersistedSettings(),
        isOnboardingComplete(),
      ]);

    return {
      people,
      debts,
      payments,
      activityEvents,
      reminders,
      preferences: {
        settings: settings ?? {},
        onboardingComplete,
      },
    };
  }

  private async readPeople(): Promise<BackupPayloadV1["people"]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<PersonRow>(
      "SELECT * FROM people ORDER BY created_at ASC, id ASC",
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private async readDebts(): Promise<BackupPayloadV1["debts"]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<DebtRow>(
      "SELECT * FROM debts ORDER BY created_at ASC, id ASC",
    );

    return rows.map((row) => ({
      id: row.id,
      personId: row.person_id,
      originalAmount: row.original_amount,
      currency: row.currency,
      reason: row.reason,
      dueDate: row.due_date,
      lentDate: row.lent_date,
      reminderEnabled: row.reminder_enabled === 1,
      reminderTime: row.reminder_time,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      direction: row.direction,
    }));
  }

  private async readPayments(): Promise<BackupPayloadV1["payments"]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<PaymentRow>(
      "SELECT * FROM payments ORDER BY created_at ASC, id ASC",
    );

    return rows.map((row) => ({
      id: row.id,
      debtId: row.debt_id,
      amount: row.amount,
      paidAt: row.paid_at,
      note: row.note,
      createdAt: row.created_at,
    }));
  }

  private async readActivityEvents(): Promise<BackupPayloadV1["activityEvents"]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<ActivityEventRow>(
      "SELECT * FROM activity_events ORDER BY occurred_at ASC, id ASC",
    );

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      debtId: row.debt_id,
      paymentId: row.payment_id,
      personId: row.person_id,
      amount: row.amount,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
    }));
  }

  private async readReminders(): Promise<BackupPayloadV1["reminders"]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<ReminderRow>(
      `SELECT id, debt_id, type, remind_at, status, read_at, created_at, updated_at, group_key, archived_at
       FROM reminders
       ORDER BY created_at ASC, id ASC`,
    );

    return rows.map((row) => ({
      id: row.id,
      debtId: row.debt_id,
      type: row.type,
      remindAt: row.remind_at,
      status: row.status,
      readAt: row.read_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      groupKey: row.group_key,
      archivedAt: row.archived_at,
    }));
  }
}
