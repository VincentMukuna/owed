import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { CreateDebtInput } from "@/features/debts/view-models";
import { syncRemindersForDebt } from "@/features/reminders/lib/reminder-sync";

import { activityKeys, debtKeys } from "./query-keys";

export function useAddDebt() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtRepository.create(input),
    onSuccess: async (debt) => {
      await syncRemindersForDebt(debt.id);
      await queryClient.invalidateQueries({ queryKey: debtKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
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
