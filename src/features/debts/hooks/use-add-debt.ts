import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { CreateDebtInput } from "@/features/debts/view-models";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

export function useAddDebt() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtRepository.create(input),
    onSuccess: async () => {
      await afterDebtDomainChange(queryClient);
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
