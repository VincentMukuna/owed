import { formatCurrency } from "@/lib/utils/formatters";
import type { ReminderType } from "@/types";

function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function parseReminderTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map(Number);
  return {
    hours: hours ?? 0,
    minutes: minutes ?? 0,
  };
}

export function combineDateAndTime(isoDate: string, reminderTime: string): Date {
  const base = parseISODate(isoDate);
  const { hours, minutes } = parseReminderTime(reminderTime);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0);
}

export function computeDueRemindAt(dueDate: string, reminderTime: string): Date {
  return combineDateAndTime(dueDate, reminderTime);
}

export function computeOverdueRemindAt(dueDate: string, reminderTime: string): Date {
  const remindAt = computeDueRemindAt(dueDate, reminderTime);
  remindAt.setDate(remindAt.getDate() + 1);
  return remindAt;
}

export function isReminderInPast(remindAt: Date, now: Date = new Date()): boolean {
  return remindAt.getTime() <= now.getTime();
}

export function toReminderISO(date: Date): string {
  return date.toISOString();
}

export type ReminderNotificationContent = {
  title: string;
  body: string;
};

export function buildReminderNotificationContent(input: {
  type: ReminderType;
  personName: string;
  remainingAmount: number;
  currency: string;
}): ReminderNotificationContent {
  const amount = formatCurrency(input.remainingAmount, input.currency);

  if (input.type === "overdue") {
    return {
      title: "Overdue",
      body: `${input.personName} was due yesterday — ${amount} still outstanding.`,
    };
  }

  return {
    title: "Promised today",
    body: `${input.personName} promised to pay ${amount} today.`,
  };
}
