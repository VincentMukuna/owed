import { isoDateToDate } from "@/features/debts/lib/format-dates";
import type { CardDebtStatus } from "@/features/debts/view-models";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDebtFallbackMeta(
  dueDateISO: string,
  status: CardDebtStatus,
  now: Date = new Date(),
): string {
  if (status === "paid") {
    return "Paid in full";
  }

  const dueDate = startOfDay(isoDateToDate(dueDateISO));
  const today = startOfDay(now);
  const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / DAY_MS);

  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    return `Overdue by ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}`;
  }

  if (daysUntilDue === 0) {
    return "Due today";
  }

  if (daysUntilDue === 1) {
    return "Due tomorrow";
  }

  if (status === "partial") {
    return "Partially paid";
  }

  return `Due in ${daysUntilDue} days`;
}
