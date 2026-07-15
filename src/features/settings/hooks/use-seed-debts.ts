import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useUiStore } from "@/features/debts/store/ui-store";
import { saveDefaultCurrency } from "@/features/reminders/lib/reminder-storage";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

import { resetDatabase } from "../dev/reset-database";
import { seedDebts, simulateRealisticUsage } from "../dev/seed-debts";

type SeedScenario = "stress" | "realistic";

export function useSeedDebts(scenario: SeedScenario = "stress") {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);
  const currency = useSettingsStore((state) => state.defaultCurrency);

  return useMutation({
    mutationFn: async () => {
      if (scenario === "realistic") {
        await resetDatabase();
        await saveDefaultCurrency("USD");
        return simulateRealisticUsage();
      }

      return seedDebts(currency);
    },
    onSuccess: async (result) => {
      await afterDebtDomainChange(queryClient, { syncReminders: false });
      showToast(
        scenario === "realistic"
          ? "Loaded screenshot-ready Home data."
          : `Seeded ${result.people} people, ${result.debts} debts, ${result.activities} activities.`,
      );
    },
    onError: (error) => {
      if (__DEV__) {
        console.error(`[useSeedDebts] failed to seed ${scenario} usage`, error);
      }
      showToast("Could not seed debts. Try again.");
    },
  });
}
