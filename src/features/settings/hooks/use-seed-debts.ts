import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useUiStore } from "@/features/debts/store/ui-store";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

import { seedDebts } from "../dev/seed-debts";

export function useSeedDebts() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => seedDebts(),
    onSuccess: async (result) => {
      await afterDebtDomainChange(queryClient, { syncReminders: false });
      showToast(
        `Seeded ${result.people} people, ${result.debts} debts, ${result.activities} activities.`,
      );
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useSeedDebts] failed to seed debts", error);
      }
      showToast("Could not seed debts. Try again.");
    },
  });
}
