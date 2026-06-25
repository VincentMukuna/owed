import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { reminderKeys } from "@/features/reminders/hooks/query-keys";
import { canScheduleOsNotifications } from "@/features/reminders/lib/notification-permissions";
import { listScheduledOsNotificationIds } from "@/features/reminders/lib/notification-service";
import {
  cancelReminderRecord,
  ensureScheduledReminder,
  isDebtReminderEligible,
  markReminderSent,
  syncOsForScheduledReminder,
} from "@/features/reminders/lib/reminder-sync";
import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { queryClient } from "@/lib/api/query-client";
import type { DebtSummary } from "@/lib/db/mappers";

export async function reconcileReminders(): Promise<void> {
  const now = new Date().toISOString();

  const missed = await reminderRepository.listScheduledBeforeOrAt(now);
  for (const reminder of missed) {
    await markReminderSent(reminder);
  }

  const stale = await reminderRepository.listIneligibleScheduled();
  for (const reminder of stale) {
    await cancelReminderRecord(reminder);
  }

  const { defaultReminderTime, overdueReminderEnabled } = useSettingsStore.getState();

  if (!overdueReminderEnabled) {
    const scheduledOverdue = await reminderRepository.listScheduledByType("overdue");
    for (const reminder of scheduledOverdue) {
      await cancelReminderRecord(reminder);
    }
  }

  const summaries = await debtRepository.listSummaries();
  const summaryById = new Map<string, DebtSummary>(
    summaries.map((summary) => [summary.id, summary]),
  );

  for (const debt of summaries) {
    if (!isDebtReminderEligible(debt)) {
      continue;
    }

    await ensureScheduledReminder(debt, "due", defaultReminderTime);

    if (overdueReminderEnabled) {
      await ensureScheduledReminder(debt, "overdue", defaultReminderTime);
    }
  }

  if (await canScheduleOsNotifications()) {
    const osNotificationIds = await listScheduledOsNotificationIds();
    const scheduled = await reminderRepository.listScheduled();

    for (const reminder of scheduled) {
      const debt = summaryById.get(reminder.debtId);
      if (!debt || !isDebtReminderEligible(debt)) {
        continue;
      }

      await syncOsForScheduledReminder(reminder, debt, osNotificationIds);
    }
  }

  await queryClient.invalidateQueries({ queryKey: reminderKeys.all });
}
