import type { ReminderType } from "@/types";

export type SingleReminderNotificationData = {
  kind: "single";
  debtId: string;
  reminderId: string;
  type: ReminderType;
};

export type GroupReminderNotificationData = {
  kind: "group";
  type: ReminderType;
  focusDate: string;
};

export type ReminderNotificationData =
  | SingleReminderNotificationData
  | GroupReminderNotificationData;

function isReminderType(value: unknown): value is ReminderType {
  return value === "due" || value === "overdue";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function parseReminderNotificationData(
  data: Record<string, unknown> | undefined,
): ReminderNotificationData | null {
  if (!data) {
    return null;
  }

  const { kind, debtId, reminderId, focusDate, type } = data;

  if (!isReminderType(type)) {
    return null;
  }

  if (kind === "group") {
    if (!isNonEmptyString(focusDate)) {
      return null;
    }
    return { kind: "group", type, focusDate };
  }

  // Default to "single" so notifications scheduled before this field existed
  // (which only carried debtId/reminderId/type) still route correctly.
  if (isNonEmptyString(debtId) && isNonEmptyString(reminderId)) {
    return { kind: "single", debtId, reminderId, type };
  }

  return null;
}
