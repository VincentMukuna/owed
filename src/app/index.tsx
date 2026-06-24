import { useEffect, useState } from "react";

import { Redirect } from "expo-router";

import { isOnboardingComplete } from "@/features/onboarding/lib/onboarding-storage";
import { HOME_ROUTE } from "@/lib/navigation/routes";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      setShowOnboarding(!complete);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return null;
  }

  return <Redirect href={showOnboarding ? "/onboarding" : HOME_ROUTE} />;
}
