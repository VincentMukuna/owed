import { Platform } from "react-native";

import {
  AndroidImportance,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";

import type { ReminderNotificationData } from "@/features/reminders/lib/notification-data";
import { canScheduleOsNotifications } from "@/features/reminders/lib/notification-permissions";

export const REMINDER_NOTIFICATION_CHANNEL_ID = "owed-reminders";

let initialized = false;

export async function initNotifications(): Promise<void> {
  if (initialized || Platform.OS === "web") {
    return;
  }

  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await setNotificationChannelAsync(REMINDER_NOTIFICATION_CHANNEL_ID, {
      name: "Payment notifications",
      importance: AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  initialized = true;
}

export type ScheduleReminderNotificationInput = {
  remindAt: string;
  title: string;
  body: string;
  data: ReminderNotificationData;
};

export async function scheduleReminderNotification(
  input: ScheduleReminderNotificationInput,
): Promise<string | null> {
  if (!(await canScheduleOsNotifications())) {
    return null;
  }

  const triggerDate = new Date(input.remindAt);
  if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) {
    return null;
  }

  return scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      data: input.data as unknown as Record<string, unknown>,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === "android" ? REMINDER_NOTIFICATION_CHANNEL_ID : undefined,
    },
  });
}

export async function cancelReminderNotification(notificationId: string): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Notification may already have fired or been cleared by the OS.
  }
}

export async function cancelReminderNotifications(
  notificationIds: Iterable<string>,
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const unique = new Set(notificationIds);
  await Promise.all([...unique].map((id) => cancelReminderNotification(id)));
}

export async function listScheduledOsNotificationIds(): Promise<Set<string>> {
  if (Platform.OS === "web") {
    return new Set();
  }

  const scheduled = await getAllScheduledNotificationsAsync();
  return new Set(scheduled.map((request) => request.identifier));
}
