import { useMutation, useQueryClient } from "@tanstack/react-query";

import { personRepository } from "@/features/debts/repositories/person-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import { errorNotification, mediumImpact } from "@/lib/haptics";
import { afterPersonListChange } from "@/lib/mutations/after-person-list-change";
import type { Person } from "@/types";

type AddPersonInput = {
  name: string;
  phoneNumber?: string;
  notes?: string;
};

export function useAddPerson() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: AddPersonInput): Promise<Person> =>
      personRepository.create(input.name, {
        phoneNumber: input.phoneNumber,
        notes: input.notes,
      }),
    onSuccess: async () => {
      await afterPersonListChange(queryClient);
      mediumImpact();
      showToast("Person added.", "success");
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useAddPerson] failed to add person", error);
      }
      errorNotification();
      showToast("Could not add person. Try again.", "error");
    },
  });
}
