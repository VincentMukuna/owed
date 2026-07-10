import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import type { UpdateDebtInput } from "@/features/debts/view-models";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

type UpdateDebtVariables = {
  debtId: string;
  input: UpdateDebtInput;
};

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ debtId, input }: UpdateDebtVariables) => debtRepository.update(debtId, input),
    onSuccess: async (_debt, variables) => {
      await afterDebtDomainChange(queryClient, { debtId: variables.debtId });
      showToast("Changes saved.");
    },
    onError: () => {
      showToast("Could not save changes. Try again.");
    },
  });
}
