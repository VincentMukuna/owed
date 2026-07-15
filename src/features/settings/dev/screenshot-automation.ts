import type { Href } from "expo-router";

import { disableAppLock } from "@/features/app-lock/store/use-app-lock-store";
import { useUiStore } from "@/features/debts/store/ui-store";
import { completeOnboarding } from "@/features/onboarding/lib/onboarding-storage";
import {
  saveDefaultCurrency,
  saveThemePreference,
} from "@/features/reminders/lib/reminder-storage";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { queryClient } from "@/lib/api/query-client";
import { getDb } from "@/lib/db/client";

import { resetDatabase } from "./reset-database";
import {
  type ScreenshotAutomationConfig,
  screenshotTargetHref,
} from "./screenshot-automation-config";
import { simulateRealisticUsage } from "./seed-debts";

export const SCREENSHOT_REFERENCE_NOW = new Date("2026-07-15T12:00:00.000Z");

export async function prepareScreenshotAutomation(
  config: ScreenshotAutomationConfig,
): Promise<Href> {
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

  return resolveScreenshotTargetHref(config);
}

async function resolveScreenshotTargetHref(config: ScreenshotAutomationConfig): Promise<Href> {
  if (config.target === "debt-detail") {
    const db = await getDb();
    const debt = await db.getFirstAsync<{ id: string }>(`
      SELECT d.id
      FROM debts d
      INNER JOIN (
        SELECT debt_id, COUNT(*) AS payment_count, SUM(amount) AS paid_total
        FROM payments
        GROUP BY debt_id
      ) payment_totals ON payment_totals.debt_id = d.id
      WHERE d.archived_at IS NULL
        AND payment_totals.payment_count > 0
        AND payment_totals.paid_total > 0
        AND payment_totals.paid_total < d.original_amount
      ORDER BY payment_totals.payment_count DESC, d.original_amount DESC, d.id ASC
      LIMIT 1
    `);
    if (!debt) {
      throw new Error("Screenshot fixture has no partially paid debt with payment history.");
    }
    return `/debt/${debt.id}` as Href;
  }

  if (config.target === "person-detail") {
    const db = await getDb();
    const person = await db.getFirstAsync<{ id: string }>(`
      SELECT p.id
      FROM people p
      INNER JOIN debts d ON d.person_id = p.id AND d.archived_at IS NULL
      LEFT JOIN payments payment ON payment.debt_id = d.id
      GROUP BY p.id
      HAVING COUNT(DISTINCT d.id) > 0 AND COUNT(payment.id) > 0
      ORDER BY COUNT(DISTINCT d.id) DESC, COUNT(payment.id) DESC, p.id ASC
      LIMIT 1
    `);
    if (!person) {
      throw new Error("Screenshot fixture has no person with debts and payment history.");
    }
    return `/person/${person.id}` as Href;
  }

  return screenshotTargetHref(config.target);
}
