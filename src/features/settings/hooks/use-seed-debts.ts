import { useMutation, useQueryClient } from "@tanstack/react-query";

import { activityKeys, debtKeys } from "@/features/debts/hooks/query-keys";
import { useUiStore } from "@/features/debts/store/ui-store";

import { seedDebts } from "../dev/seed-debts";

export function useSeedDebts() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => seedDebts(),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: debtKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
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
