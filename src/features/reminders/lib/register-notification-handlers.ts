import {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
} from "expo-notifications";
import { router } from "expo-router";

import { parseReminderNotificationData } from "@/features/reminders/lib/notification-data";
import { initNotifications } from "@/features/reminders/lib/notification-service";

function navigateToDebtFromNotification(data: Record<string, unknown> | undefined): void {
  const parsed = parseReminderNotificationData(data);
  if (!parsed) {
    return;
  }

  router.push(`/debt/${parsed.debtId}`);
}

export async function registerNotificationHandlers(): Promise<() => void> {
  await initNotifications();

  const lastResponse = getLastNotificationResponse();
  if (lastResponse) {
    navigateToDebtFromNotification(lastResponse.notification.request.content.data);
    clearLastNotificationResponse();
  }

  const responseSubscription = addNotificationResponseReceivedListener((response) => {
    navigateToDebtFromNotification(response.notification.request.content.data);
  });

  return () => {
    responseSubscription.remove();
  };
}
