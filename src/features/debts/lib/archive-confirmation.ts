import { Alert } from "react-native";

import type { DebtCardView, DebtDetailView } from "@/features/debts/view-models";

export function confirmArchiveDebt(debt: DebtCardView | DebtDetailView, onConfirm: () => void) {
  const isPaid = debt.remaining <= 0;

  Alert.alert(
    "Archive this debt?",
    isPaid
      ? "It will be removed from your lists. Payment history will be kept."
      : "It will be removed from your active lists and totals. Payment history will be kept.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: onConfirm },
    ],
  );
}
