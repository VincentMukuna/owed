import { useQuery } from "@tanstack/react-query";

import { fetchUnreadReminderCount } from "@/features/reminders/lib/fetch-reminders";

import { reminderKeys } from "./query-keys";

export function useUnreadReminderCount() {
  return useQuery({
    queryKey: reminderKeys.unreadCount(),
    queryFn: fetchUnreadReminderCount,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
