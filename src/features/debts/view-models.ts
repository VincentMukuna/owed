import type { DebtDirection, DebtStatus } from "@/types";

export type { DebtStatus };
export type { DebtDirection };

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
  direction: DebtDirection;
  amount: number;
  remaining: number;
  lastPaymentAt?: string;
  currency: string;
  dueDate: string;
  /** Raw ISO due date (YYYY-MM-DD) for filtering; `dueDate` is the display string. */
  dueDateISO: string;
  reason: string;
  status: CardDebtStatus;
  /** Raw creation timestamp for deterministic list ordering. */
  createdAt: string;
  addedDate: string;
  payments: PaymentView[];
  reminder: boolean;
};

export type DebtDetailView = DebtCardView;

/**
 * How a debt's person is resolved at write time. `existing` uses a chosen
 * person id directly; `new` always inserts a fresh person. De-duplication is
 * decided in the picker UI, never re-derived from the name at write time.
 */
export type PersonRef = { kind: "existing"; id: string } | { kind: "new"; name: string };

export type CreateDebtInput = {
  person: PersonRef;
  direction: DebtDirection;
  originalAmount: number;
  dueDate: string;
  reason?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  currency: string;
};

export type PersonPickerView = {
  id: string;
  name: string;
  initials: string;
  outstanding: number;
  openDebtCount: number;
};

export type RecordPaymentInput = {
  amount: number;
  paidAt?: string;
  note?: string;
};

export type UpdateDebtInput = {
  originalAmount: number;
  dueDate: string;
  reason?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
};

export type ActivityViewType =
  | "payment"
  | "add"
  | "paid"
  | "amount-changed"
  | "due-date-changed"
  | "archived";

export type ActivityView = {
  id: string;
  text: string;
  sub: string;
  time: string;
  type: ActivityViewType;
};
