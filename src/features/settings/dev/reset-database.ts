import AsyncStorage from "@react-native-async-storage/async-storage";

import { APP_CONFIG } from "@/constants/config";
import { hydrateOnboardingState } from "@/features/onboarding/lib/onboarding-storage";
import {
  cancelReminderNotifications,
  listScheduledOsNotificationIds,
} from "@/features/reminders/lib/notification-service";
import { hydrateReminderSettings } from "@/features/reminders/lib/reminder-storage";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { getDb } from "@/lib/db/client";

const STORAGE_PREFIX = "@owed/";

export async function resetDatabase(): Promise<void> {
  const scheduledIds = await listScheduledOsNotificationIds();
  await cancelReminderNotifications(scheduledIds);

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM reminders;
      DELETE FROM activity_events;
      DELETE FROM payments;
      DELETE FROM debts;
      DELETE FROM people;
    `);
  });

  const keys = await AsyncStorage.getAllKeys();
  const owedKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
  if (owedKeys.length > 0) {
    await AsyncStorage.multiRemove(owedKeys);
  }

  useSettingsStore.setState({
    defaultCurrency: APP_CONFIG.defaultCurrency,
    defaultReminderTime: APP_CONFIG.defaultReminderTime,
    overdueReminderEnabled: false,
    notificationsPermissionAsked: false,
    onboardingComplete: false,
  });

  await hydrateReminderSettings();
  await hydrateOnboardingState();
}
