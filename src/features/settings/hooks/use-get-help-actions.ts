import { useCallback } from "react";

import { type Href, router } from "expo-router";

import { useUiStore } from "@/features/debts/store/ui-store";
import { selectionChange } from "@/lib/haptics";

export function useGetHelpActions() {
  const showToast = useUiStore((state) => state.showToast);

  const handleShareFeedbackPress = useCallback(() => {
    selectionChange();
    router.push("/share-feedback" as Href);
  }, []);

  const handleHelpCenterPress = useCallback(() => {
    selectionChange();
    showToast("Help Center coming soon.");
  }, [showToast]);

  const handleAboutPress = useCallback(() => {
    selectionChange();
    router.push("/about" as Href);
  }, []);

  return {
    handleShareFeedbackPress,
    handleHelpCenterPress,
    handleAboutPress,
  };
}
