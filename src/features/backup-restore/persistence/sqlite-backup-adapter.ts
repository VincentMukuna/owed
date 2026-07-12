import {
  hydrateOnboardingState,
  isOnboardingComplete,
} from "@/features/onboarding/lib/onboarding-storage";
import {
  hydratePersistedSettings,
  loadPersistedSettings,
} from "@/features/reminders/lib/reminder-storage";
import { setItem, storageKeys } from "@/lib/storage/local-storage";

import type { BackupPayloadV1, BackupRecordCounts } from "../domain/backup-payload-v1";
import type {
  BackupOperationContext,
  BackupSnapshot,
  BackupSnapshotMetadata,
} from "./backup-snapshot";

type BackupDatabaseConnection = {
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
  withExclusiveTransactionAsync(
    task: (txn: BackupDatabaseTransaction) => Promise<void>,
  ): Promise<void>;
};

type BackupDatabaseTransaction = {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: unknown[]): Promise<unknown>;
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

export class SQLiteBackupAdapter implements BackupSnapshot {
  constructor(private readonly getDb: () => Promise<BackupDatabaseConnection>) {}

  async getMetadata(): Promise<BackupSnapshotMetadata> {
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

  async getCurrentRecordCounts(): Promise<BackupRecordCounts> {
    const db = await this.getDb();
    const [people, debts, payments, activityEvents, reminders] = await Promise.all([
      countRows(db, "people"),
      countRows(db, "debts"),
      countRows(db, "payments"),
      countRows(db, "activity_events"),
      countRows(db, "reminders"),
    ]);

    return {
      people,
      debts,
      payments,
      activityEvents,
      reminders,
    };
  }

  async replaceSnapshot(
    payload: BackupPayloadV1,
    _context: BackupOperationContext,
  ): Promise<BackupRecordCounts> {
    const db = await this.getDb();

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(`
        DELETE FROM reminders;
        DELETE FROM activity_events;
        DELETE FROM payments;
        DELETE FROM debts;
        DELETE FROM people;
      `);

      for (const person of payload.people) {
        await txn.runAsync(
          `INSERT INTO people (id, name, phone_number, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          person.id,
          person.name,
          person.phoneNumber,
          person.notes,
          person.createdAt,
          person.updatedAt,
        );
      }

      for (const debt of payload.debts) {
        await txn.runAsync(
          `INSERT INTO debts (
             id, person_id, original_amount, currency, reason, due_date, lent_date,
             reminder_enabled, reminder_time, archived_at, created_at, updated_at, direction
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          debt.id,
          debt.personId,
          debt.originalAmount,
          debt.currency,
          debt.reason,
          debt.dueDate,
          debt.lentDate,
          debt.reminderEnabled ? 1 : 0,
          debt.reminderTime,
          debt.archivedAt,
          debt.createdAt,
          debt.updatedAt,
          debt.direction,
        );
      }

      for (const payment of payload.payments) {
        await txn.runAsync(
          `INSERT INTO payments (id, debt_id, amount, paid_at, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          payment.id,
          payment.debtId,
          payment.amount,
          payment.paidAt,
          payment.note,
          payment.createdAt,
        );
      }

      for (const activity of payload.activityEvents) {
        await txn.runAsync(
          `INSERT INTO activity_events (
             id, type, debt_id, payment_id, person_id, amount, occurred_at, created_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          activity.id,
          activity.type,
          activity.debtId,
          activity.paymentId,
          activity.personId,
          activity.amount,
          activity.occurredAt,
          activity.createdAt,
        );
      }

      for (const reminder of payload.reminders) {
        await txn.runAsync(
          `INSERT INTO reminders (
             id, debt_id, type, remind_at, status, notification_id, read_at,
             created_at, updated_at, group_key, archived_at
           )
           VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
          reminder.id,
          reminder.debtId,
          reminder.type,
          reminder.remindAt,
          reminder.status,
          reminder.readAt,
          reminder.createdAt,
          reminder.updatedAt,
          reminder.groupKey,
          reminder.archivedAt,
        );
      }
    });

    await setItem(storageKeys.settings, payload.preferences.settings);
    await setItem(storageKeys.onboardingComplete, payload.preferences.onboardingComplete);
    await Promise.all([hydratePersistedSettings(), hydrateOnboardingState()]);

    return {
      people: payload.people.length,
      debts: payload.debts.length,
      payments: payload.payments.length,
      activityEvents: payload.activityEvents.length,
      reminders: payload.reminders.length,
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

async function countRows(db: BackupDatabaseConnection, tableName: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM ${tableName}`,
  );
  return row?.count ?? 0;
}
