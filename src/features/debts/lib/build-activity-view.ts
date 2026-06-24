import { formatRelativeTime } from "@/features/debts/lib/format-dates";
import type { ActivityView, ActivityViewType } from "@/features/debts/view-models";
import { formatCurrency, getFirstName } from "@/lib/utils/formatters";
import type { ActivityEventType } from "@/types";

import type { ActivityEventWithRelations } from "../repositories/activity-repository";

function toActivityViewType(type: ActivityEventType): ActivityViewType {
  switch (type) {
    case "debt_created":
      return "add";
    case "payment_recorded":
      return "payment";
    case "debt_paid":
      return "paid";
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
  const reason = event.debtReason?.trim() || "—";
  const currency = event.debtCurrency;

  let text: string;
  let sub: string;

  switch (event.type) {
    case "debt_created":
      text = `You added ${formatCurrency(amount, currency)} owed by ${event.personName}`;
      sub = reason;
      break;
    case "payment_recorded":
      text = `${event.personName} paid ${formatCurrency(amount, currency)}`;
      sub = buildPaymentSub(event.paymentNote, event.debtReason);
      break;
    case "debt_paid":
      text = `${getFirstName(event.personName)}'s debt was marked as paid`;
      sub = `${formatCurrency(amount, currency)} · ${reason}`;
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
