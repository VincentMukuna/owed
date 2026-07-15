import { disableAppLock } from "@/features/app-lock/store/use-app-lock-store";
import { useUiStore } from "@/features/debts/store/ui-store";
import { completeOnboarding } from "@/features/onboarding/lib/onboarding-storage";
import {
  saveDefaultCurrency,
  saveThemePreference,
} from "@/features/reminders/lib/reminder-storage";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { queryClient } from "@/lib/api/query-client";

import { resetDatabase } from "./reset-database";
import type { ScreenshotAutomationConfig } from "./screenshot-automation-config";
import { simulateRealisticUsage } from "./seed-debts";

export const SCREENSHOT_REFERENCE_NOW = new Date("2026-07-15T12:00:00.000Z");

export async function prepareScreenshotAutomation(
  config: ScreenshotAutomationConfig,
): Promise<void> {
  if (!__DEV__) {
    throw new Error("Screenshot automation is only available in development builds.");
  }

  useUiStore.getState().clearToast();
  await Promise.all([completeOnboarding(), disableAppLock()]);
  await resetDatabase();
  await Promise.all([saveDefaultCurrency("USD"), saveThemePreference(config.theme)]);
  await simulateRealisticUsage(SCREENSHOT_REFERENCE_NOW);
  await runReminderSync();

  // Root launch prefetches before this route runs. Clear those snapshots so the
  // target route reads the freshly seeded fixture through its normal query hook.
  queryClient.clear();
}
