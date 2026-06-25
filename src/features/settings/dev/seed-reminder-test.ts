import type { SQLiteDatabase } from "expo-sqlite";

import { faker } from "@faker-js/faker";

import { APP_CONFIG } from "@/constants/config";
import { toISODate } from "@/features/debts/lib/format-dates";
import { saveOverdueReminderEnabled } from "@/features/reminders/lib/reminder-storage";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { getDb } from "@/lib/db/client";
import { createId } from "@/lib/id";

/** Per bucket — six debts crosses the collapse threshold for one grouped push. */
export const SEED_REMINDER_TEST_COUNT = 6;

export type SeedReminderTestResult = {
  dueDebts: number;
  overdueDebts: number;
  reminderTime: string;
  dueDate: string;
  overdueDueDate: string;
};

type SeedDebtRow = {
  id: string;
  personId: string;
  name: string;
  amount: number;
  dueDate: string;
  reason: string;
};

function buildDebtRows(count: number, dueDate: string, reason: string): SeedDebtRow[] {
  return Array.from({ length: count }, () => ({
    id: createId(),
    personId: createId(),
    name: faker.person.fullName(),
    amount: faker.number.int({ min: 1000, max: 25_000 }),
    dueDate,
    reason,
  }));
}

async function insertDebts(
  db: SQLiteDatabase,
  debts: SeedDebtRow[],
  reminderTime: string,
  nowIso: string,
): Promise<void> {
  for (const debt of debts) {
    await db.runAsync(
      `INSERT INTO people (id, name, phone_number, notes, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, ?, ?)`,
      debt.personId,
      debt.name,
      nowIso,
      nowIso,
    );

    await db.runAsync(
      `INSERT INTO debts (
        id, person_id, original_amount, currency, reason, due_date, lent_date,
        reminder_enabled, reminder_time, archived_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, NULL, ?, ?)`,
      debt.id,
      debt.personId,
      debt.amount,
      APP_CONFIG.defaultCurrency,
      debt.reason,
      debt.dueDate,
      reminderTime,
      nowIso,
      nowIso,
    );

    await db.runAsync(
      `INSERT INTO activity_events (
        id, type, debt_id, payment_id, person_id, amount, occurred_at, created_at
      ) VALUES (?, 'debt_created', ?, NULL, ?, ?, ?, ?)`,
      createId(),
      debt.id,
      debt.personId,
      debt.amount,
      nowIso,
      nowIso,
    );
  }
}

/**
 * Dev helper: creates two collapsed buckets — {@link SEED_REMINDER_TEST_COUNT} debts
 * due today (due) and the same count due yesterday (overdue) — both firing at the
 * configured reminder time. Enables overdue reminders if needed.
 */
export async function seedReminderTestDebts(): Promise<SeedReminderTestResult> {
  const now = new Date();
  const nowIso = now.toISOString();
  const dueDate = toISODate(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const overdueDueDate = toISODate(yesterday);

  const reminderTime = useSettingsStore.getState().defaultReminderTime;

  if (!useSettingsStore.getState().overdueReminderEnabled) {
    await saveOverdueReminderEnabled(true);
  }

  const dueDebts = buildDebtRows(SEED_REMINDER_TEST_COUNT, dueDate, "Reminder test (due)");
  const overdueDebts = buildDebtRows(
    SEED_REMINDER_TEST_COUNT,
    overdueDueDate,
    "Reminder test (overdue)",
  );

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await insertDebts(db, dueDebts, reminderTime, nowIso);
    await insertDebts(db, overdueDebts, reminderTime, nowIso);
  });

  return {
    dueDebts: dueDebts.length,
    overdueDebts: overdueDebts.length,
    reminderTime,
    dueDate,
    overdueDueDate,
  };
}
