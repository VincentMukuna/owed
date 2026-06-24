import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { getItem, setItem, storageKeys } from "@/lib/storage/local-storage";

export async function isOnboardingComplete(): Promise<boolean> {
  const stored = await getItem<boolean>(storageKeys.onboardingComplete);
  return stored === true;
}

export async function completeOnboarding(): Promise<void> {
  await setItem(storageKeys.onboardingComplete, true);
  useSettingsStore.getState().setOnboardingComplete(true);
}

export async function hydrateOnboardingState(): Promise<boolean> {
  const complete = await isOnboardingComplete();
  useSettingsStore.getState().setOnboardingComplete(complete);
  return complete;
}
