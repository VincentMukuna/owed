import { useCallback } from "react";

import { type Href, router } from "expo-router";

import type { FeedbackCategory } from "@/features/settings/lib/product-feedback";
import { selectionChange } from "@/lib/haptics";

export function useGetHelpActions() {
  const handleShareFeedbackPress = useCallback((category?: FeedbackCategory) => {
    selectionChange();
    router.push(
      category
        ? ({
            pathname: "/share-feedback",
            params: { category },
          } as Href)
        : ("/share-feedback" as Href),
    );
  }, []);

  const handleHelpCenterPress = useCallback(() => {
    selectionChange();
    router.push("/help-center" as Href);
  }, []);

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
