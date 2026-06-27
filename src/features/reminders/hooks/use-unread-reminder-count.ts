import { useQuery } from "@tanstack/react-query";

import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";

import { reminderKeys } from "./query-keys";

export function useUnreadReminderCount() {
  return useQuery({
    queryKey: reminderKeys.unreadCount(),
    queryFn: () => reminderRepository.countUnread(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
