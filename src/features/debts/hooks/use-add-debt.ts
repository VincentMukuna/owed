import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { CreateDebtInput } from "@/features/debts/view-models";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { invalidateAfterDebtMutation } from "@/lib/query/invalidate-queries";

export function useAddDebt() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtRepository.create(input),
    onSuccess: async () => {
      await runReminderSync();
      await invalidateAfterDebtMutation(queryClient);
      showToast("Debt saved.");
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useAddDebt] failed to save debt", error);
      }
      showToast("Could not save debt. Try again.");
    },
  });
}
