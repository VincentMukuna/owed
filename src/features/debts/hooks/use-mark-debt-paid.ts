import { useCallback } from "react";

import { Alert } from "react-native";

import type { DebtCardView, DebtDetailView } from "@/features/debts/view-models";
import { formatCurrency, getFirstName } from "@/lib/utils/formatters";

import { useRecordPayment } from "./use-record-payment";

export function useMarkDebtPaid() {
  const { isPending, mutate } = useRecordPayment();

  const markDebtPaid = useCallback(
    (debt: DebtCardView | DebtDetailView) => {
      if (debt.remaining <= 0 || isPending) {
        return;
      }

      const firstName = getFirstName(debt.name);
      const amount = formatCurrency(debt.remaining, debt.currency);
      const message =
        debt.direction === "they_owe_me"
          ? `This will record a final payment of ${amount} from ${firstName}.`
          : `This will record a final payment of ${amount} to ${firstName}.`;

      Alert.alert("Mark as paid?", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Paid",
          onPress: () => {
            mutate({
              debtId: debt.id,
              input: { amount: debt.remaining },
              remainingBeforePayment: debt.remaining,
            });
          },
        },
      ]);
    },
    [isPending, mutate],
  );

  return { isPending, markDebtPaid };
}
