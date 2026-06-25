import { Alert, Platform } from "react-native";

import {
  getNotificationPermissionState,
  requestOsNotificationPermissions,
} from "@/features/reminders/lib/notification-permissions";
import { saveNotificationsPermissionAsked } from "@/features/reminders/lib/reminder-storage";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";

const EXPLAINER_TITLE = "Get a nudge on promised dates";
const EXPLAINER_MESSAGE =
  "Owed can remind you on the day someone promised to pay. You will still see reminders in the app if notifications are off.";

export async function promptForReminderPermissionsIfNeeded(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const permissionState = await getNotificationPermissionState();
  if (permissionState === "allowed") {
    return;
  }

  const { notificationsPermissionAsked } = useSettingsStore.getState();
  if (notificationsPermissionAsked) {
    return;
  }

  await new Promise<void>((resolve) => {
    Alert.alert(EXPLAINER_TITLE, EXPLAINER_MESSAGE, [
      {
        text: "Not now",
        style: "cancel",
        onPress: () => resolve(),
      },
      {
        text: "Allow",
        onPress: () => {
          void (async () => {
            await saveNotificationsPermissionAsked(true);
            await requestOsNotificationPermissions();
            resolve();
          })();
        },
      },
    ]);
  });
}

export async function requestReminderPermissionsFromOnboarding(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  await saveNotificationsPermissionAsked(true);
  await requestOsNotificationPermissions();
}
