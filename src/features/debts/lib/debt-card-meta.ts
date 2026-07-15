import { isoDateToDate } from "@/features/debts/lib/format-dates";
import type { CardDebtStatus } from "@/features/debts/view-models";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DebtAttentionMeta = {
  label: string;
  tone: "danger" | "warning";
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntil(dueDateISO: string, now: Date): number {
  const dueDate = startOfDay(isoDateToDate(dueDateISO));
  const today = startOfDay(now);
  return Math.round((dueDate.getTime() - today.getTime()) / DAY_MS);
}

export function formatDebtFallbackMeta(
  dueDateISO: string,
  status: CardDebtStatus,
  now: Date = new Date(),
): string {
  if (status === "paid") {
    return "Paid in full";
  }

  const daysUntilDue = daysUntil(dueDateISO, now);

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

export function formatDebtAttentionMeta(
  dueDateISO: string,
  now: Date = new Date(),
): DebtAttentionMeta {
  const daysUntilDue = daysUntil(dueDateISO, now);

  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    const duration = `${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}`;
    return {
      label: `Overdue by ${duration}`,
      tone: "danger",
    };
  }

  const timing =
    daysUntilDue === 0
      ? "due today"
      : daysUntilDue === 1
        ? "due tomorrow"
        : `due in ${daysUntilDue} days`;

  return {
    label: timing.charAt(0).toUpperCase() + timing.slice(1),
    tone: "warning",
  };
}
