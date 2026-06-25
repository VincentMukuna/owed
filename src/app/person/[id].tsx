import { useLocalSearchParams } from "expo-router";

import { PersonDetailScreen } from "@/features/people/screens/person-detail-screen";

export default function PersonDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PersonDetailScreen personId={id ?? ""} />;
}
