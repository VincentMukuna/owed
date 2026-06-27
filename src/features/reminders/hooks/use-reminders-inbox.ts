import { useQuery } from "@tanstack/react-query";

import { formatRelativeTime } from "@/features/debts/lib/format-dates";
import { buildReminderNotificationContent } from "@/features/reminders/lib/reminder-scheduler";
import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";

import { reminderKeys } from "./query-keys";

export async function loadRemindersInbox() {
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

export function useRemindersInbox() {
  return useQuery({
    queryKey: reminderKeys.inbox(),
    queryFn: loadRemindersInbox,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
