import type { QueryClient } from "@tanstack/react-query";

import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import {
  invalidateAfterDebtMutation,
  type DebtMutationInvalidationOptions,
} from "@/lib/query/invalidate-queries";

export type AfterDebtDomainChangeOptions = DebtMutationInvalidationOptions & {
  syncReminders?: boolean;
};

/** Post-write pipeline for changes that affect debts, payments, activity, or people rollups. */
export async function afterDebtDomainChange(
  queryClient: QueryClient,
  options: AfterDebtDomainChangeOptions = {},
) {
  const { syncReminders = true, ...invalidation } = options;

  if (syncReminders) {
    await runReminderSync();
  }

  await invalidateAfterDebtMutation(queryClient, invalidation);
}
