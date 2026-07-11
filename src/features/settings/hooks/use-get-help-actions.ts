import { useCallback } from "react";

import { type Href, router } from "expo-router";

import { useUiStore } from "@/features/debts/store/ui-store";
import { reportAppIssue } from "@/features/settings/lib/report-app-issue";
import { selectionChange } from "@/lib/haptics";

export function useGetHelpActions() {
  const showToast = useUiStore((state) => state.showToast);

  const handleReportIssue = useCallback(() => {
    reportAppIssue();
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
    handleReportIssue,
    handleHelpCenterPress,
    handleAboutPress,
  };
}
