import { useQuery } from "@tanstack/react-query";

import { fetchReminderInboxViews } from "@/features/reminders/lib/fetch-reminders";

import { reminderKeys } from "./query-keys";

export function useRemindersInbox() {
  return useQuery({
    queryKey: reminderKeys.inbox(),
    queryFn: fetchReminderInboxViews,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
