import {
  cancelReminderNotifications,
  listScheduledOsNotificationIds,
} from "@/features/reminders/lib/notification-service";
import { getDb } from "@/lib/db/client";

/**
 * Wipes user records (debts, people, payments, reminders, activity) while
 * preserving preferences — currency/reminder defaults, notification settings,
 * and onboarding state stay in AsyncStorage and the settings store untouched.
 */
export async function resetDatabase(): Promise<void> {
  const scheduledIds = await listScheduledOsNotificationIds();
  await cancelReminderNotifications(scheduledIds);

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM reminders;
      DELETE FROM activity_events;
      DELETE FROM payments;
      DELETE FROM debts;
      DELETE FROM people;
    `);
  });
}
