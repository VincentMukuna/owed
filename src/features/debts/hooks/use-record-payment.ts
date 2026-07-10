import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { RecordPaymentInput } from "@/features/debts/view-models";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

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
      await afterDebtDomainChange(queryClient, { debtId: variables.debtId });

      const isFullPayment = variables.input.amount >= variables.remainingBeforePayment;
      const fullMessage =
        debt.direction === "i_owe_them" ? "Promise settled." : "Promise marked as paid.";
      showToast(isFullPayment ? fullMessage : "Payment recorded.");
    },
    onError: () => {
      showToast("Could not add payment. Try again.");
    },
  });
}
