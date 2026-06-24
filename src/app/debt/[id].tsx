import { useLocalSearchParams } from 'expo-router';

import { DebtDetailScreen } from '@/features/debts/screens/DebtDetailScreen';

export default function DebtDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <DebtDetailScreen debtId={Number(id)} />;
}
