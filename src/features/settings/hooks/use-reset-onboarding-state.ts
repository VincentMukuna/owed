import { useMutation } from "@tanstack/react-query";

import { useUiStore } from "@/features/debts/store/ui-store";
import { resetOnboardingState } from "@/features/onboarding/lib/onboarding-storage";

export function useResetOnboardingState() {
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => resetOnboardingState(),
    onSuccess: () => {
      showToast("Onboarding reset.");
    },
    onError: (error) => {
      if (__DEV__) {
        console.error("[useResetOnboardingState] failed to reset onboarding", error);
      }
      showToast("Could not reset onboarding. Try again.");
    },
  });
}
