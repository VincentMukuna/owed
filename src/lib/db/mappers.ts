import type { Payment, Person } from "@/types";

import type { DebtsRow, PaymentsRow, PeopleRow } from "./row-types";

const LOCAL_USER_ID = "local";

export function rowToPerson(row: PeopleRow): Person {
  return {
    id: row.id,
    userId: LOCAL_USER_ID,
    name: row.name,
    phoneNumber: row.phone_number ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToPayment(row: PaymentsRow): Payment {
  return {
    id: row.id,
    debtId: row.debt_id,
    amount: row.amount,
    paidAt: row.paid_at,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

export type DebtWithRelations = {
  id: string;
  person: Person;
  originalAmount: number;
  remainingAmount: number;
  currency: string;
  reason?: string;
  dueDate: string;
  lentDate?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
};

export type DebtSummary = Omit<DebtWithRelations, "payments">;

export type PersonSummary = {
  id: string;
  name: string;
  phoneNumber?: string;
  /** Remaining balance summed across the person's non-archived debts. */
  outstanding: number;
  /** Original amount summed across the person's non-archived debts. */
  originalTotal: number;
  /** Number of non-archived debts that still have a remaining balance. */
  openDebtCount: number;
  /** Open debts whose due date is before today (timing-based, ignores partial). */
  overdueCount: number;
  /** Open debts due today through `dueSoonDays` ahead, none overdue. */
  dueSoonCount: number;
  /** Non-archived debts that are fully paid (no remaining balance). */
  paidDebtCount: number;
  /** Non-archived debts linked to this person. */
  totalDebtCount: number;
  /** Most recent of debt creation / payment time, falling back to person creation. */
  lastActivityAt: string;
};

function mapDebtFields(debt: DebtsRow, person: PeopleRow, remainingAmount: number): DebtSummary {
  return {
    id: debt.id,
    person: rowToPerson(person),
    originalAmount: debt.original_amount,
    remainingAmount,
    currency: debt.currency,
    reason: debt.reason ?? undefined,
    dueDate: debt.due_date,
    lentDate: debt.lent_date ?? undefined,
    reminderEnabled: debt.reminder_enabled === 1,
    reminderTime: debt.reminder_time ?? undefined,
    archivedAt: debt.archived_at ?? undefined,
    createdAt: debt.created_at,
    updatedAt: debt.updated_at,
  };
}

export function toDebtSummary(debt: DebtsRow, person: PeopleRow, paidTotal: number): DebtSummary {
  return mapDebtFields(debt, person, debt.original_amount - paidTotal);
}

export function toDebtWithRelations(
  debt: DebtsRow,
  person: PeopleRow,
  payments: PaymentsRow[],
): DebtWithRelations {
  const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    ...mapDebtFields(debt, person, debt.original_amount - paidTotal),
    payments: payments.map(rowToPayment),
  };
}
