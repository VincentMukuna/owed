import { useLocalSearchParams } from "expo-router";

import { EditPersonScreen } from "@/features/people/screens/edit-person-screen";

export default function EditPersonRoute() {
  const { personId } = useLocalSearchParams<{ personId: string }>();

  return <EditPersonScreen personId={personId ?? ""} />;
}
