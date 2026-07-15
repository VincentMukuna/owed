import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import { errorNotification, lightImpact } from "@/lib/haptics";
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
      lightImpact();
      showToast("Debt archived.", "success");
    },
    onError: () => {
      errorNotification();
      showToast("Could not archive debt. Try again.", "error");
    },
  });
}
