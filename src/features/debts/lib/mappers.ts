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
import type { DebtSummary, DebtWithRelations } from "@/lib/db/mappers";
import { getInitials } from "@/lib/utils/formatters";

function toPaymentView(payment: DebtWithRelations["payments"][number], now?: Date): PaymentView {
  return {
    id: payment.id,
    amount: payment.amount,
    date: formatPaymentDate(payment.paidAt, now),
    note: payment.note ?? "",
  };
}

export function toDebtCardView(debt: DebtSummary | DebtWithRelations, now?: Date): DebtCardView {
  const status = computeDebtStatus({
    originalAmount: debt.originalAmount,
    remainingAmount: debt.remainingAmount,
    dueDate: debt.dueDate,
    archivedAt: debt.archivedAt,
    now,
  }) as CardDebtStatus;

  const payments =
    "payments" in debt ? debt.payments.map((payment) => toPaymentView(payment, now)) : [];

  return {
    id: debt.id,
    name: debt.person.name,
    initials: getInitials(debt.person.name),
    amount: debt.originalAmount,
    remaining: debt.remainingAmount,
    currency: debt.currency,
    dueDate: formatDueDate(debt.dueDate),
    dueDateISO: debt.dueDate,
    reason: debt.reason?.trim() || "",
    status,
    addedDate: formatAddedDate(debt.createdAt),
    payments,
    reminder: debt.reminderEnabled,
  };
}

export function toDebtDetailView(debt: DebtWithRelations, now?: Date): DebtDetailView {
  return toDebtCardView(debt, now);
}
