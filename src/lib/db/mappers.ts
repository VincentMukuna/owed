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

export function toDebtWithRelations(
  debt: DebtsRow,
  person: PeopleRow,
  payments: PaymentsRow[],
): DebtWithRelations {
  const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    id: debt.id,
    person: rowToPerson(person),
    originalAmount: debt.original_amount,
    remainingAmount: debt.original_amount - paidTotal,
    currency: debt.currency,
    reason: debt.reason ?? undefined,
    dueDate: debt.due_date,
    lentDate: debt.lent_date ?? undefined,
    reminderEnabled: debt.reminder_enabled === 1,
    reminderTime: debt.reminder_time ?? undefined,
    archivedAt: debt.archived_at ?? undefined,
    createdAt: debt.created_at,
    updatedAt: debt.updated_at,
    payments: payments.map(rowToPayment),
  };
}
