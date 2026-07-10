import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

type ArchiveDebtVariables = {
  debtId: string;
};

export function useArchiveDebt() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ debtId }: ArchiveDebtVariables) => debtRepository.archive(debtId),
    onSuccess: async (_result, variables) => {
      await afterDebtDomainChange(queryClient, { debtId: variables.debtId });
      showToast("Debt archived.");
    },
    onError: () => {
      showToast("Could not archive debt. Try again.");
    },
  });
}
