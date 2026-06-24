import { useLocalSearchParams } from "expo-router";

import { DebtDetailScreen } from "@/features/debts/screens/debt-detail-screen";

export default function DebtDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <DebtDetailScreen debtId={Number(id)} />;
}
