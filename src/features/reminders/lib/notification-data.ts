import type { ReminderType } from "@/types";

export type ReminderNotificationData = {
  debtId: string;
  reminderId: string;
  type: ReminderType;
};

export function parseReminderNotificationData(
  data: Record<string, unknown> | undefined,
): ReminderNotificationData | null {
  if (!data) {
    return null;
  }

  const { debtId, reminderId, type } = data;

  if (typeof debtId !== "string" || debtId.length === 0) {
    return null;
  }

  if (typeof reminderId !== "string" || reminderId.length === 0) {
    return null;
  }

  if (type !== "due" && type !== "overdue") {
    return null;
  }

  return { debtId, reminderId, type };
}
