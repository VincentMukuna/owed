import { faker } from "@faker-js/faker";

import { APP_CONFIG } from "@/constants/config";
import { toISODate } from "@/features/debts/lib/format-dates";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { getDb } from "@/lib/db/client";
import { createId } from "@/lib/id";

/** Six debts → crosses the collapse threshold so the next run fires one grouped push. */
export const SEED_REMINDER_TEST_COUNT = 6;

export type SeedReminderTestResult = {
  debts: number;
  reminderTime: string;
  dueDate: string;
};

/**
 * Dev helper: creates {@link SEED_REMINDER_TEST_COUNT} reminder-enabled debts all
 * due today, so their "due" reminders land in a single bucket that fires at the
 * configured reminder time. Set the reminder time a few minutes ahead, seed,
 * then wait for the collapsed notification.
 */
export async function seedReminderTestDebts(): Promise<SeedReminderTestResult> {
  const db = await getDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const dueDate = toISODate(now);
  const reminderTime = useSettingsStore.getState().defaultReminderTime;

  const debts = Array.from({ length: SEED_REMINDER_TEST_COUNT }, () => ({
    id: createId(),
    personId: createId(),
    name: faker.person.fullName(),
    amount: faker.number.int({ min: 1000, max: 25_000 }),
  }));

  await db.withTransactionAsync(async () => {
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
        "Reminder test",
        dueDate,
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
  });

  return { debts: debts.length, reminderTime, dueDate };
}
