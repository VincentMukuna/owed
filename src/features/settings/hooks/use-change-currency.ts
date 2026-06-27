import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import { saveDefaultCurrency } from "@/features/reminders/lib/reminder-storage";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { convertAllAmountsToCurrency } from "@/features/settings/lib/convert-currency";
import { afterDebtDomainChange } from "@/lib/mutations/after-debt-domain-change";

type ChangeCurrencyInput = {
  fromCurrency: string;
  toCurrency: string;
  rate?: number;
};

export function useChangeCurrency() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: async ({ fromCurrency, toCurrency, rate }: ChangeCurrencyInput) => {
      if (fromCurrency === toCurrency) {
        return;
      }

      const hasDebts = await debtRepository.hasAnyDebts();

      if (!hasDebts) {
        await saveDefaultCurrency(toCurrency);
        return;
      }

      if (rate === undefined) {
        throw new Error("Exchange rate is required when debts exist");
      }

      await convertAllAmountsToCurrency({ rate, toCurrency });
      await saveDefaultCurrency(toCurrency);
    },
    onSuccess: async (_result, { toCurrency, fromCurrency }) => {
      if (fromCurrency === toCurrency) {
        return;
      }

      await afterDebtDomainChange(queryClient);
      showToast(`Switched to ${toCurrency}`);
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useChangeCurrency] failed", error);
      }
      showToast("Couldn't convert amounts. Nothing was changed.");
    },
  });
}

export function useCurrentCurrency(): string {
  return useSettingsStore((state) => state.defaultCurrency);
}
