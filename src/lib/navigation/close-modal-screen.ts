import { router } from "expo-router";

import { HOME_ROUTE } from "@/lib/navigation/routes";

export function closeModalScreen() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(HOME_ROUTE);
}
