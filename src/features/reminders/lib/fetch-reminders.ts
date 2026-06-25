import { formatRelativeTime } from "@/features/debts/lib/format-dates";
import { buildReminderNotificationContent } from "@/features/reminders/lib/reminder-scheduler";
import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";
import type { ReminderType } from "@/types";

export type ReminderInboxView = {
  id: string;
  debtId: string;
  type: ReminderType;
  title: string;
  body: string;
  time: string;
};

export async function fetchReminderInboxViews(): Promise<ReminderInboxView[]> {
  const now = new Date();
  const items = await reminderRepository.listInbox();

  return items.map((item) => {
    const content = buildReminderNotificationContent({
      type: item.type,
      personName: item.personName,
      remainingAmount: item.remainingAmount,
      currency: item.currency,
    });

    return {
      id: item.id,
      debtId: item.debtId,
      type: item.type,
      title: content.title,
      body: content.body,
      time: formatRelativeTime(item.remindAt, now),
    };
  });
}

export async function fetchUnreadReminderCount(): Promise<number> {
  return reminderRepository.countUnread();
}
