import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { getItem, removeItem, setItem, storageKeys } from "@/lib/storage/local-storage";

export async function isOnboardingComplete(): Promise<boolean> {
  const stored = await getItem<boolean>(storageKeys.onboardingComplete);
  return stored === true;
}

export async function completeOnboarding(): Promise<void> {
  await setItem(storageKeys.onboardingComplete, true);
  useSettingsStore.getState().setOnboardingComplete(true);
}

export async function resetOnboardingState(): Promise<void> {
  await removeItem(storageKeys.onboardingComplete);
  useSettingsStore.getState().setOnboardingComplete(false);
}

export async function hydrateOnboardingState(): Promise<boolean> {
  const complete = await isOnboardingComplete();
  useSettingsStore.getState().setOnboardingComplete(complete);
  return complete;
}
