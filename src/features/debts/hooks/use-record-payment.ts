import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { RecordPaymentInput } from "@/features/debts/view-models";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { invalidateAfterDebtMutation } from "@/lib/query/invalidate-queries";

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
    onSuccess: async (_debt, variables) => {
      await runReminderSync();
      await invalidateAfterDebtMutation(queryClient, { debtId: variables.debtId });

      const isFullPayment = variables.input.amount >= variables.remainingBeforePayment;
      showToast(isFullPayment ? "Debt marked as paid." : "Payment recorded.");
    },
    onError: () => {
      showToast("Could not record payment. Try again.");
    },
  });
}
