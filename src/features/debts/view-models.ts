import type { DebtStatus } from "@/types";

export type { DebtStatus };

export type CardDebtStatus = Exclude<DebtStatus, "archived">;

export type PaymentView = {
  id: string;
  amount: number;
  date: string;
  note: string;
};

export type DebtCardView = {
  id: string;
  name: string;
  initials: string;
  amount: number;
  remaining: number;
  dueDate: string;
  /** Raw ISO due date (YYYY-MM-DD) for filtering; `dueDate` is the display string. */
  dueDateISO: string;
  reason: string;
  status: CardDebtStatus;
  addedDate: string;
  payments: PaymentView[];
  reminder: boolean;
};

export type DebtDetailView = DebtCardView;

export type CreateDebtInput = {
  personName: string;
  originalAmount: number;
  dueDate: string;
  reason?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  currency?: string;
};

export type RecordPaymentInput = {
  amount: number;
  paidAt?: string;
  note?: string;
};

export type ActivityViewType = "payment" | "add" | "paid";

export type ActivityView = {
  id: string;
  text: string;
  sub: string;
  time: string;
  type: ActivityViewType;
};
