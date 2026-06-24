import { APP_CONFIG } from "@/constants/config";
import type { DebtStatus } from "@/types";

function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

function isWithinDays(dueDateIso: string, now: Date, days: number): boolean {
  const dueStart = startOfDay(parseISODate(dueDateIso));
  const nowStart = startOfDay(now);
  const diffMs = dueStart.getTime() - nowStart.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  return diffDays >= 0 && diffDays <= days;
}

export function computeDebtStatus(input: {
  originalAmount: number;
  remainingAmount: number;
  dueDate: string;
  archivedAt?: string | null;
  now?: Date;
}): DebtStatus {
  if (input.archivedAt) {
    return "archived";
  }

  const { originalAmount, remainingAmount, dueDate } = input;
  const now = input.now ?? new Date();

  if (remainingAmount <= 0) {
    return "paid";
  }

  if (remainingAmount < originalAmount) {
    return "partial";
  }

  if (isBefore(parseISODate(dueDate), startOfDay(now))) {
    return "overdue";
  }

  if (isWithinDays(dueDate, now, APP_CONFIG.dueSoonDays)) {
    return "due-soon";
  }

  return "active";
}
