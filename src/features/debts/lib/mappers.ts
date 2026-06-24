import { computeDebtStatus } from "@/features/debts/lib/compute-debt-status";
import {
  formatAddedDate,
  formatDueDate,
  formatPaymentDate,
} from "@/features/debts/lib/format-dates";
import type {
  CardDebtStatus,
  DebtCardView,
  DebtDetailView,
  PaymentView,
} from "@/features/debts/view-models";
import type { DebtWithRelations } from "@/lib/db/mappers";
import { getInitials } from "@/lib/utils/formatters";

function toPaymentView(payment: DebtWithRelations["payments"][number], now?: Date): PaymentView {
  return {
    id: payment.id,
    amount: payment.amount,
    date: formatPaymentDate(payment.paidAt, now),
    note: payment.note ?? "",
  };
}

export function toDebtCardView(debt: DebtWithRelations, now?: Date): DebtCardView {
  const status = computeDebtStatus({
    originalAmount: debt.originalAmount,
    remainingAmount: debt.remainingAmount,
    dueDate: debt.dueDate,
    archivedAt: debt.archivedAt,
    now,
  }) as CardDebtStatus;

  return {
    id: debt.id,
    name: debt.person.name,
    initials: getInitials(debt.person.name),
    amount: debt.originalAmount,
    remaining: debt.remainingAmount,
    dueDate: formatDueDate(debt.dueDate),
    reason: debt.reason?.trim() || "—",
    status,
    addedDate: formatAddedDate(debt.createdAt),
    payments: debt.payments.map((payment) => toPaymentView(payment, now)),
    reminder: debt.reminderEnabled,
  };
}

export function toDebtDetailView(debt: DebtWithRelations, now?: Date): DebtDetailView {
  return toDebtCardView(debt, now);
}
