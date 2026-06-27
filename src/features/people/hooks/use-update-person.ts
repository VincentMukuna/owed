import { useMutation, useQueryClient } from "@tanstack/react-query";

import { personRepository } from "@/features/debts/repositories/person-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

type UpdatePersonInput = {
  id: string;
  name: string;
  phoneNumber?: string;
  notes?: string;
};

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: UpdatePersonInput) =>
      personRepository.update(input.id, {
        name: input.name,
        phoneNumber: input.phoneNumber,
        notes: input.notes,
      }),
    onSuccess: async () => {
      await afterDebtDomainChange(queryClient);
      showToast("Changes saved.");
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useUpdatePerson] failed to update person", error);
      }
      showToast("Could not save changes. Try again.");
    },
  });
}
