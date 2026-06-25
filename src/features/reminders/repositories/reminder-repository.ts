import { getDb } from "@/lib/db/client";
import type { RemindersRow } from "@/lib/db/row-types";
import { createId } from "@/lib/id";
import type { Reminder, ReminderStatus, ReminderType } from "@/types";

export type CreateReminderInput = {
  debtId: string;
  type: ReminderType;
  remindAt: string;
  status?: ReminderStatus;
  notificationId?: string;
  groupKey?: string;
};

export type ReminderInboxItem = Reminder & {
  personName: string;
  remainingAmount: number;
  currency: string;
};

type ReminderInboxRow = RemindersRow & {
  person_name: string;
  original_amount: number;
  paid_total: number;
  currency: string;
};

function rowToReminder(row: RemindersRow): Reminder {
  return {
    id: row.id,
    debtId: row.debt_id,
    type: row.type as ReminderType,
    remindAt: row.remind_at,
    status: row.status as ReminderStatus,
    notificationId: row.notification_id ?? undefined,
    readAt: row.read_at ?? undefined,
    groupKey: row.group_key ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToInboxItem(row: ReminderInboxRow): ReminderInboxItem {
  return {
    ...rowToReminder(row),
    personName: row.person_name,
    remainingAmount: row.original_amount - row.paid_total,
    currency: row.currency,
  };
}

export const reminderRepository = {
  async create(input: CreateReminderInput): Promise<Reminder> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = createId();

    await db.runAsync(
      `INSERT INTO reminders (
        id,
        debt_id,
        type,
        remind_at,
        status,
        notification_id,
        read_at,
        group_key,
        archived_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.debtId,
      input.type,
      input.remindAt,
      input.status ?? "scheduled",
      input.notificationId ?? null,
      null,
      input.groupKey ?? null,
      null,
      now,
      now,
    );

    const row = await db.getFirstAsync<RemindersRow>("SELECT * FROM reminders WHERE id = ?", id);
    if (!row) {
      throw new Error("Failed to create reminder");
    }

    return rowToReminder(row);
  },

  async getById(id: string): Promise<Reminder | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<RemindersRow>("SELECT * FROM reminders WHERE id = ?", id);
    return row ? rowToReminder(row) : null;
  },

  async getScheduledByDebtAndType(debtId: string, type: ReminderType): Promise<Reminder | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<RemindersRow>(
      `SELECT * FROM reminders
       WHERE debt_id = ? AND type = ? AND status = 'scheduled'
       LIMIT 1`,
      debtId,
      type,
    );
    return row ? rowToReminder(row) : null;
  },

  async getActiveByDebtTypeAndRemindAt(
    debtId: string,
    type: ReminderType,
    remindAt: string,
  ): Promise<Reminder | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<RemindersRow>(
      `SELECT * FROM reminders
       WHERE debt_id = ? AND type = ? AND remind_at = ? AND status IN ('scheduled', 'sent')
       LIMIT 1`,
      debtId,
      type,
      remindAt,
    );
    return row ? rowToReminder(row) : null;
  },

  async listScheduled(): Promise<Reminder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RemindersRow>(
      `SELECT * FROM reminders
       WHERE status = 'scheduled'
       ORDER BY remind_at ASC`,
    );
    return rows.map(rowToReminder);
  },

  async listActive(): Promise<Reminder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RemindersRow>(
      `SELECT * FROM reminders
       WHERE status IN ('scheduled', 'sent')
       ORDER BY remind_at ASC`,
    );
    return rows.map(rowToReminder);
  },

  async listScheduledForDebt(debtId: string): Promise<Reminder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RemindersRow>(
      `SELECT * FROM reminders
       WHERE debt_id = ? AND status = 'scheduled'
       ORDER BY remind_at ASC`,
      debtId,
    );
    return rows.map(rowToReminder);
  },

  async listScheduledBeforeOrAt(iso: string): Promise<Reminder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RemindersRow>(
      `SELECT * FROM reminders
       WHERE status = 'scheduled' AND remind_at <= ?
       ORDER BY remind_at ASC`,
      iso,
    );
    return rows.map(rowToReminder);
  },

  async listScheduledByType(type: ReminderType): Promise<Reminder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RemindersRow>(
      `SELECT * FROM reminders
       WHERE status = 'scheduled' AND type = ?
       ORDER BY remind_at ASC`,
      type,
    );
    return rows.map(rowToReminder);
  },

  async listIneligibleScheduled(): Promise<Reminder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RemindersRow>(
      `SELECT r.* FROM reminders r
       INNER JOIN debts d ON d.id = r.debt_id
       LEFT JOIN (
         SELECT debt_id, SUM(amount) AS paid_total
         FROM payments
         GROUP BY debt_id
       ) pay ON pay.debt_id = d.id
       WHERE r.status = 'scheduled'
         AND (
           d.reminder_enabled = 0
           OR d.archived_at IS NOT NULL
           OR (d.original_amount - COALESCE(pay.paid_total, 0)) <= 0
         )`,
    );
    return rows.map(rowToReminder);
  },

  async listInbox(): Promise<ReminderInboxItem[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ReminderInboxRow>(
      `SELECT
        r.*,
        p.name AS person_name,
        d.original_amount,
        d.currency,
        COALESCE(pay_totals.paid_total, 0) AS paid_total
      FROM reminders r
      INNER JOIN debts d ON d.id = r.debt_id
      INNER JOIN people p ON p.id = d.person_id
      LEFT JOIN (
        SELECT debt_id, SUM(amount) AS paid_total
        FROM payments
        GROUP BY debt_id
      ) pay_totals ON pay_totals.debt_id = d.id
      WHERE r.status = 'sent' AND r.archived_at IS NULL
      ORDER BY r.remind_at DESC`,
    );
    return rows.map(rowToInboxItem);
  },

  async countUnread(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM reminders
       WHERE status = 'sent' AND read_at IS NULL AND archived_at IS NULL`,
    );
    return row?.count ?? 0;
  },

  async markArchivedBefore(iso: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE reminders
       SET archived_at = ?, updated_at = ?
       WHERE status IN ('sent', 'cancelled')
         AND archived_at IS NULL
         AND remind_at < ?`,
      now,
      now,
      iso,
    );
  },

  async clearScheduledNotificationIds(): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE reminders
       SET notification_id = NULL, updated_at = ?
       WHERE status = 'scheduled' AND notification_id IS NOT NULL`,
      now,
    );
  },

  async setRemindersNotificationId(ids: string[], notificationId: string): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const db = await getDb();
    const now = new Date().toISOString();
    const placeholders = ids.map(() => "?").join(", ");
    await db.runAsync(
      `UPDATE reminders
       SET notification_id = ?, updated_at = ?
       WHERE id IN (${placeholders})`,
      notificationId,
      now,
      ...ids,
    );
  },

  async markAllInboxRead(): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE reminders
       SET read_at = ?, updated_at = ?
       WHERE status = 'sent' AND read_at IS NULL`,
      now,
      now,
    );
  },

  async update(
    id: string,
    input: {
      status?: ReminderStatus;
      remindAt?: string;
      notificationId?: string | null;
      readAt?: string | null;
      groupKey?: string | null;
    },
  ): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    const current = await db.getFirstAsync<RemindersRow>(
      "SELECT * FROM reminders WHERE id = ?",
      id,
    );

    if (!current) {
      return;
    }

    await db.runAsync(
      `UPDATE reminders
       SET status = ?, remind_at = ?, notification_id = ?, read_at = ?, group_key = ?, updated_at = ?
       WHERE id = ?`,
      input.status ?? current.status,
      input.remindAt ?? current.remind_at,
      input.notificationId !== undefined ? input.notificationId : current.notification_id,
      input.readAt !== undefined ? input.readAt : current.read_at,
      input.groupKey !== undefined ? input.groupKey : current.group_key,
      now,
      id,
    );
  },

  async cancelScheduledForDebt(debtId: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE reminders
       SET status = 'cancelled', notification_id = NULL, updated_at = ?
       WHERE debt_id = ? AND status = 'scheduled'`,
      now,
      debtId,
    );
  },

  async cancelScheduledByType(debtId: string, type: ReminderType): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE reminders
       SET status = 'cancelled', notification_id = NULL, updated_at = ?
       WHERE debt_id = ? AND type = ? AND status = 'scheduled'`,
      now,
      debtId,
      type,
    );
  },
};
