import { Linking, Platform } from "react-native";

import {
  IosAuthorizationStatus,
  type NotificationPermissionsStatus,
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications";

export type NotificationPermissionState = "allowed" | "off" | "not-asked";

export function isOsNotificationPermissionGranted(status: NotificationPermissionsStatus): boolean {
  return status.granted || status.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (Platform.OS === "web") {
    return "off";
  }

  const status = await getPermissionsAsync();

  if (isOsNotificationPermissionGranted(status)) {
    return "allowed";
  }

  if (
    status.ios?.status === IosAuthorizationStatus.DENIED ||
    (status.granted === false && status.canAskAgain === false)
  ) {
    return "off";
  }

  return "not-asked";
}

export async function canScheduleOsNotifications(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const status = await getPermissionsAsync();
  return isOsNotificationPermissionGranted(status);
}

export async function requestOsNotificationPermissions(): Promise<NotificationPermissionState> {
  if (Platform.OS === "web") {
    return "off";
  }

  const status = await requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  if (isOsNotificationPermissionGranted(status)) {
    return "allowed";
  }

  if (
    status.ios?.status === IosAuthorizationStatus.DENIED ||
    (status.granted === false && status.canAskAgain === false)
  ) {
    return "off";
  }

  return "not-asked";
}

export async function openOsNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}
