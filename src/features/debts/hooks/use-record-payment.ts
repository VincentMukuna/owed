import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { RecordPaymentInput } from "@/features/debts/view-models";
import { cancelRemindersForDebt } from "@/features/reminders/lib/reminder-sync";

import { activityKeys, debtKeys } from "./query-keys";

type RecordPaymentVariables = {
  debtId: string;
  input: RecordPaymentInput;
  remainingBeforePayment: number;
};

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ debtId, input }: RecordPaymentVariables) =>
      debtRepository.recordPayment(debtId, input),
    onSuccess: async (debt, variables) => {
      if (debt.remainingAmount <= 0) {
        await cancelRemindersForDebt(variables.debtId);
      }

      await queryClient.invalidateQueries({ queryKey: debtKeys.all });
      await queryClient.invalidateQueries({ queryKey: debtKeys.detail(variables.debtId) });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });

      const isFullPayment = variables.input.amount >= variables.remainingBeforePayment;
      showToast(isFullPayment ? "Debt marked as paid." : "Payment recorded.");
    },
    onError: () => {
      showToast("Could not record payment. Try again.");
    },
  });
}
