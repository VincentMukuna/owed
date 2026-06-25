import { useMutation, useQueryClient } from "@tanstack/react-query";

import { peopleKeys } from "@/features/debts/hooks/query-keys";
import { personRepository } from "@/features/debts/repositories/person-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
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
      // A debt-less person only affects the people lists/picker.
      await queryClient.invalidateQueries({ queryKey: peopleKeys.all });
      showToast("Person added.");
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useAddPerson] failed to add person", error);
      }
      showToast("Could not add person. Try again.");
    },
  });
}
