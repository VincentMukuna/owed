import { Alert, Platform } from "react-native";

import {
  type NotificationPermissionState,
  getNotificationPermissionState,
  requestOsNotificationPermissions,
} from "@/features/reminders/lib/notification-permissions";
import { saveNotificationsPermissionAsked } from "@/features/reminders/lib/reminder-storage";

const EXPLAINER_TITLE = "Get a nudge on promised dates";
const EXPLAINER_MESSAGE =
  "Owed can remind you on the day someone promised to pay. You will still see reminders in the app if notifications are off.";

/**
 * Called when the user turns a reminder on. Primes + requests OS permission
 * when it has never been asked; otherwise returns the current state so the
 * caller can surface an inline hint. Never blocks enabling the reminder.
 */
export async function requestReminderPermissionOnToggle(): Promise<NotificationPermissionState> {
  if (Platform.OS === "web") {
    return "off";
  }

  const state = await getNotificationPermissionState();
  if (state === "allowed" || state === "off") {
    return state;
  }

  return new Promise<NotificationPermissionState>((resolve) => {
    Alert.alert(EXPLAINER_TITLE, EXPLAINER_MESSAGE, [
      {
        text: "Not now",
        style: "cancel",
        onPress: () => {
          void saveNotificationsPermissionAsked(true);
          resolve("not-asked");
        },
      },
      {
        text: "Allow",
        onPress: () => {
          void (async () => {
            await saveNotificationsPermissionAsked(true);
            const result = await requestOsNotificationPermissions();
            resolve(result);
          })();
        },
      },
    ]);
  });
}
