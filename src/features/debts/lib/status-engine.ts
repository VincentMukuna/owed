import { APP_CONFIG } from "@/constants/config";
import { toISODate } from "@/features/debts/lib/format-dates";
import type { CardDebtStatus } from "@/features/debts/view-models";
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

/** Card-level debt status. Partial payment beats overdue on individual debts. */
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

export const DEBT_STATUS_LABELS: Record<CardDebtStatus, string> = {
  active: "Active",
  "due-soon": "Due soon",
  overdue: "Overdue",
  partial: "Partial",
  paid: "Paid",
};

/**
 * Person-level rollup status. Uses SQL aggregate counts (see person-repository)
 * where overdue = any open debt past due, including partially paid ones — so a
 * person can show Overdue while an individual debt card still shows Partial.
 */
export type PersonStatus = "overdue" | "due-soon" | "active" | "settled" | "none";

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  overdue: "Overdue",
  "due-soon": "Due soon",
  active: "Active",
  settled: "Settled",
  none: "No debts",
};

export function derivePersonStatus(input: {
  overdueCount: number;
  dueSoonCount: number;
  openDebtCount: number;
  totalDebtCount: number;
}): PersonStatus {
  if (input.totalDebtCount === 0) {
    return "none";
  }
  if (input.overdueCount > 0) {
    return "overdue";
  }
  if (input.dueSoonCount > 0) {
    return "due-soon";
  }
  if (input.openDebtCount > 0) {
    return "active";
  }
  return "settled";
}

/** Calendar bounds for person SQL aggregates — keep in sync with computeDebtStatus. */
export function statusDateParams(now: Date = new Date()): [string, string, string] {
  const today = toISODate(now);
  const soon = toISODate(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + APP_CONFIG.dueSoonDays),
  );

  return [today, today, soon];
}
