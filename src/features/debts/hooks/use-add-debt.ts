import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { CreateDebtInput } from "@/features/debts/view-models";
import { reminderKeys } from "@/features/reminders/hooks/query-keys";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";

import { activityKeys, debtKeys, peopleKeys } from "./query-keys";

export function useAddDebt() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtRepository.create(input),
    onSuccess: async () => {
      await runReminderSync();
      await queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      await queryClient.invalidateQueries({ queryKey: debtKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      await queryClient.invalidateQueries({ queryKey: peopleKeys.all });
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
