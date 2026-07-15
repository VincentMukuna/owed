import { formatRelativeTime } from "@/features/debts/lib/format-dates";
import type { ActivityEventWithRelations } from "@/features/debts/repositories/activity-repository";
import type { ActivityView, ActivityViewType } from "@/features/debts/view-models";
import { formatCurrency, getFirstName } from "@/lib/utils/formatters";
import type { ActivityEventType } from "@/types";

function toActivityViewType(type: ActivityEventType): ActivityViewType {
  switch (type) {
    case "debt_created":
      return "add";
    case "payment_recorded":
      return "payment";
    case "debt_paid":
      return "paid";
    case "debt_amount_changed":
      return "amount-changed";
    case "debt_due_date_changed":
      return "due-date-changed";
    case "debt_archived":
      return "archived";
  }
}

function buildPaymentSub(note?: string, reason?: string): string {
  const noteText = note?.trim() ?? "";
  const reasonText = reason?.trim() ?? "";

  if (noteText && reasonText) {
    return `${noteText} · ${reasonText}`;
  }

  if (noteText) {
    return noteText;
  }

  if (reasonText) {
    return reasonText;
  }

  return "Partial payment";
}

export function buildActivityView(
  event: ActivityEventWithRelations,
  now: Date = new Date(),
): ActivityView {
  const amount = event.amount ?? 0;
  const reason = event.debtReason?.trim() ?? "";
  const currency = event.debtCurrency;

  let text: string;
  let sub: string;

  switch (event.type) {
    case "debt_created":
      text =
        event.debtDirection === "i_owe_them"
          ? `You added ${formatCurrency(amount, currency)} you owe ${event.personName}`
          : `You added ${formatCurrency(amount, currency)} owed by ${event.personName}`;
      sub = reason || "Debt created";
      break;
    case "payment_recorded":
      text =
        event.debtDirection === "i_owe_them"
          ? `You paid ${event.personName} ${formatCurrency(amount, currency)}`
          : `${event.personName} paid ${formatCurrency(amount, currency)}`;
      sub = buildPaymentSub(event.paymentNote, event.debtReason);
      break;
    case "debt_paid":
      text =
        event.debtDirection === "i_owe_them"
          ? `Your debt to ${getFirstName(event.personName)} was marked as paid`
          : `${getFirstName(event.personName)}'s debt was marked as paid`;
      sub = reason
        ? `${formatCurrency(amount, currency)} · ${reason}`
        : formatCurrency(amount, currency);
      break;
    case "debt_amount_changed":
      text = `Amount changed for ${event.personName}`;
      sub = reason
        ? `${formatCurrency(amount, currency)} · ${reason}`
        : `New amount: ${formatCurrency(amount, currency)}`;
      break;
    case "debt_due_date_changed":
      text = `Due date changed for ${event.personName}`;
      sub = reason || "Debt terms updated";
      break;
    case "debt_archived":
      text = `Debt archived for ${event.personName}`;
      sub = reason || "Payment history kept";
      break;
  }

  return {
    id: event.id,
    text,
    sub,
    time: formatRelativeTime(event.occurredAt, now),
    type: toActivityViewType(event.type),
  };
}
