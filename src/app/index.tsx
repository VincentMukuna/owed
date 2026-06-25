import { Redirect } from "expo-router";

import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { HOME_ROUTE } from "@/lib/navigation/routes";

export default function Index() {
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);

  return <Redirect href={onboardingComplete ? HOME_ROUTE : "/onboarding"} />;
}
