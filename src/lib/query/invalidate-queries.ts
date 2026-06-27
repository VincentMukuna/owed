import type { QueryClient } from "@tanstack/react-query";

import { activityKeys, debtKeys, peopleKeys } from "@/features/debts/hooks/query-keys";
import { reminderKeys } from "@/features/reminders/hooks/query-keys";

export type DebtMutationInvalidationOptions = {
  debtId?: string;
};

export function invalidateDebtQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: debtKeys.all }),
    queryClient.invalidateQueries({ queryKey: debtKeys.paidThisMonth }),
  ]);
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

/** Invalidates list caches touched by debt/payment/currency mutations. Reminder inbox is refreshed by `runReminderSync`. */
export function invalidateAfterDebtMutation(
  queryClient: QueryClient,
  options: DebtMutationInvalidationOptions = {},
) {
  const invalidations = [
    invalidateDebtQueries(queryClient),
    invalidateActivityQueries(queryClient),
    invalidatePeopleQueries(queryClient),
  ];

  if (options.debtId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: debtKeys.detail(options.debtId) }),
    );
  }

  return Promise.all(invalidations);
}

export function invalidateHomeQueries(queryClient: QueryClient) {
  return Promise.all([
    invalidateDebtQueries(queryClient),
    invalidateActivityQueries(queryClient),
    invalidateReminderQueries(queryClient),
  ]);
}
