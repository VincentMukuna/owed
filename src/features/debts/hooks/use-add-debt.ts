import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { CreateDebtInput } from "@/features/debts/view-models";
import { errorNotification, mediumImpact } from "@/lib/haptics";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

export function useAddDebt() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtRepository.create(input),
    onSuccess: async () => {
      await afterDebtDomainChange(queryClient);
      mediumImpact();
      showToast("Debt saved.", "success");
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useAddDebt] failed to save debt", error);
      }
      errorNotification();
      showToast("Could not save debt. Try again.", "error");
    },
  });
}
