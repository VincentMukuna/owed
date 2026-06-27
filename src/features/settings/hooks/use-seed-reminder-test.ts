import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useUiStore } from "@/features/debts/store/ui-store";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { formatReminderTimeDisplay } from "@/features/settings/lib/format-reminder-time";
import { invalidateAfterDebtMutation } from "@/lib/query/invalidate-queries";

import { seedReminderTestDebts } from "../dev/seed-reminder-test";

export function useSeedReminderTest() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => seedReminderTestDebts(),
    onSuccess: async (result) => {
      await runReminderSync();
      await invalidateAfterDebtMutation(queryClient);
      const time = formatReminderTimeDisplay(result.reminderTime);
      showToast(
        `Seeded ${result.dueDebts} due + ${result.overdueDebts} overdue debts for ${time}.`,
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
