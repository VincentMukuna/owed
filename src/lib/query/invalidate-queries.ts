import type { QueryClient } from "@tanstack/react-query";

import { activityKeys, debtKeys, peopleKeys } from "@/features/debts/hooks/query-keys";
import { reminderKeys } from "@/features/reminders/hooks/query-keys";

export function invalidateDebtQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: debtKeys.all });
}

export function invalidateActivityQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: activityKeys.all });
}

export function invalidatePeopleQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: peopleKeys.all });
}

export function invalidateReminderQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: reminderKeys.all });
}

export function invalidateHomeQueries(queryClient: QueryClient) {
  return Promise.all([
    invalidateDebtQueries(queryClient),
    invalidateActivityQueries(queryClient),
    invalidateReminderQueries(queryClient),
  ]);
}
