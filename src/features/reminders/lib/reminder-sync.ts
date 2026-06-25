import { debtRepository } from "@/features/debts/repositories/debt-repository";
import {
  cancelReminderNotification,
  scheduleReminderNotification,
} from "@/features/reminders/lib/notification-service";
import {
  buildReminderNotificationContent,
  computeDueRemindAt,
  computeOverdueRemindAt,
  isReminderInPast,
  toReminderISO,
} from "@/features/reminders/lib/reminder-scheduler";
import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import type { DebtSummary } from "@/lib/db/mappers";
import type { Reminder, ReminderType } from "@/types";

export function isDebtReminderEligible(debt: DebtSummary): boolean {
  return debt.reminderEnabled && !debt.archivedAt && debt.remainingAmount > 0;
}

async function cancelOsForReminders(reminders: Reminder[]): Promise<void> {
  await Promise.all(
    reminders
      .filter((reminder) => reminder.notificationId)
      .map((reminder) => cancelReminderNotification(reminder.notificationId!)),
  );
}

export async function cancelRemindersForDebt(debtId: string): Promise<void> {
  const scheduled = await reminderRepository.listScheduledForDebt(debtId);
  await cancelOsForReminders(scheduled);
  await reminderRepository.cancelScheduledForDebt(debtId);
}

async function attachOsNotification(reminder: Reminder, debt: DebtSummary): Promise<void> {
  const content = buildReminderNotificationContent({
    type: reminder.type,
    personName: debt.person.name,
    remainingAmount: debt.remainingAmount,
    currency: debt.currency,
  });

  const notificationId = await scheduleReminderNotification({
    reminderId: reminder.id,
    debtId: debt.id,
    type: reminder.type,
    remindAt: reminder.remindAt,
    title: content.title,
    body: content.body,
  });

  if (notificationId) {
    await reminderRepository.update(reminder.id, { notificationId });
  }
}

export async function scheduleNewReminder(
  debt: DebtSummary,
  type: ReminderType,
  reminderTime: string,
): Promise<Reminder | null> {
  const remindAtDate =
    type === "due"
      ? computeDueRemindAt(debt.dueDate, reminderTime)
      : computeOverdueRemindAt(debt.dueDate, reminderTime);
  const remindAtIso = toReminderISO(remindAtDate);
  const status = isReminderInPast(remindAtDate) ? "sent" : "scheduled";

  const reminder = await reminderRepository.create({
    debtId: debt.id,
    type,
    remindAt: remindAtIso,
    status,
  });

  if (status === "scheduled") {
    await attachOsNotification(reminder, debt);
    return reminderRepository.getById(reminder.id);
  }

  return reminder;
}

export async function ensureScheduledReminder(
  debt: DebtSummary,
  type: ReminderType,
  reminderTime: string,
): Promise<void> {
  const existing = await reminderRepository.getScheduledByDebtAndType(debt.id, type);
  if (existing) {
    return;
  }

  await scheduleNewReminder(debt, type, reminderTime);
}

export async function syncRemindersForDebt(debtId: string): Promise<void> {
  const debt = await debtRepository.getById(debtId);
  if (!debt) {
    return;
  }

  const summary: DebtSummary = {
    id: debt.id,
    person: debt.person,
    originalAmount: debt.originalAmount,
    remainingAmount: debt.remainingAmount,
    currency: debt.currency,
    reason: debt.reason,
    dueDate: debt.dueDate,
    lentDate: debt.lentDate,
    reminderEnabled: debt.reminderEnabled,
    reminderTime: debt.reminderTime,
    archivedAt: debt.archivedAt,
    createdAt: debt.createdAt,
    updatedAt: debt.updatedAt,
  };

  await cancelRemindersForDebt(debtId);

  if (!isDebtReminderEligible(summary)) {
    return;
  }

  const { defaultReminderTime, overdueReminderEnabled } = useSettingsStore.getState();

  await scheduleNewReminder(summary, "due", defaultReminderTime);

  if (overdueReminderEnabled) {
    await scheduleNewReminder(summary, "overdue", defaultReminderTime);
  }
}

export async function syncOsForScheduledReminder(
  reminder: Reminder,
  debt: DebtSummary,
  osNotificationIds: Set<string>,
): Promise<void> {
  if (reminder.status !== "scheduled") {
    return;
  }

  if (reminder.notificationId && osNotificationIds.has(reminder.notificationId)) {
    return;
  }

  if (reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
    await reminderRepository.update(reminder.id, { notificationId: null });
  }

  const refreshed = await reminderRepository.getById(reminder.id);
  if (!refreshed || refreshed.status !== "scheduled") {
    return;
  }

  await attachOsNotification(refreshed, debt);
}

export async function markReminderSent(reminder: Reminder): Promise<void> {
  if (reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
  }

  await reminderRepository.update(reminder.id, {
    status: "sent",
    notificationId: null,
  });
}

export async function cancelReminderRecord(reminder: Reminder): Promise<void> {
  if (reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
  }

  await reminderRepository.update(reminder.id, {
    status: "cancelled",
    notificationId: null,
  });
}
