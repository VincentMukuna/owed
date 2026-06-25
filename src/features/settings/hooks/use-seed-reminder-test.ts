import { useMutation, useQueryClient } from "@tanstack/react-query";

import { activityKeys, debtKeys } from "@/features/debts/hooks/query-keys";
import { useUiStore } from "@/features/debts/store/ui-store";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { formatReminderTimeDisplay } from "@/features/settings/lib/format-reminder-time";

import { seedReminderTestDebts } from "../dev/seed-reminder-test";

export function useSeedReminderTest() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => seedReminderTestDebts(),
    onSuccess: async (result) => {
      await runReminderSync();
      await queryClient.invalidateQueries({ queryKey: debtKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      showToast(
        `Seeded ${result.debts} debts due today at ${formatReminderTimeDisplay(result.reminderTime)}.`,
      );
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useSeedReminderTest] failed to seed reminder test", error);
      }
      showToast("Could not seed reminder test. Try again.");
    },
  });
}
