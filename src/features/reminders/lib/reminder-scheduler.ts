import { formatCurrency, getFirstName } from "@/lib/utils/formatters";
import type { DebtDirection, ReminderType } from "@/types";

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
  direction: DebtDirection;
  personName: string;
  remainingAmount: number;
  currency: string;
}): ReminderNotificationContent {
  const amount = formatCurrency(input.remainingAmount, input.currency);

  if (input.direction === "i_owe_them") {
    if (input.type === "overdue") {
      return {
        title: "Overdue",
        body: `You were due yesterday, ${amount} still owed to ${input.personName}.`,
      };
    }

    return {
      title: "Due today",
      body: `You owe ${input.personName} ${amount} today.`,
    };
  }

  if (input.type === "overdue") {
    return {
      title: "Overdue",
      body: `${input.personName} was due yesterday, ${amount} still outstanding.`,
    };
  }

  return {
    title: "Due today",
    body: `${input.personName} owes you ${amount} today.`,
  };
}

export function groupKeyFor(type: ReminderType, bucketDate: string): string {
  return `${type}:${bucketDate}`;
}

export function buildCollapsedReminderContent(input: {
  type: ReminderType;
  direction: DebtDirection | "mixed";
  /** Names ordered by remaining amount descending; only the first two are shown. */
  names: string[];
  totalCount: number;
  totalRemaining: number;
  currency: string;
}): ReminderNotificationContent {
  const amount = formatCurrency(input.totalRemaining, input.currency);

  if (input.direction === "mixed") {
    return {
      title: input.type === "overdue" ? "Overdue" : "Due today",
      body: `${input.totalCount} debts need attention, ${amount} unsettled.`,
    };
  }

  if (input.direction === "i_owe_them") {
    if (input.type === "overdue") {
      return {
        title: "Overdue",
        body: `${input.totalCount} payments you owe are overdue, ${amount} still unsettled.`,
      };
    }

    return {
      title: "Due today",
      body: `${input.totalCount} payments you owe are due today, ${amount} total.`,
    };
  }

  const shown = input.names.slice(0, 2).map(getFirstName);
  const remainder = input.totalCount - shown.length;
  const lead = shown.join(", ");
  const people = remainder > 0 ? `${lead}, and ${remainder} more` : lead;

  if (input.type === "overdue") {
    return {
      title: "Overdue",
      body: `${people} were due yesterday, ${amount} still owed.`,
    };
  }

  return {
    title: "Due today",
    body: `${people} owe you ${amount} today.`,
  };
}
