import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useUiStore } from "@/features/debts/store/ui-store";

import { resetDatabase } from "../dev/reset-database";

export function useResetDatabase() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => resetDatabase(),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      showToast("Database reset.");
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useResetDatabase] failed to reset database", error);
      }
      showToast("Could not reset database. Try again.");
    },
  });
}
