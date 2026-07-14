import type { DebtDirection } from "@/types";

export type DebtExportRow = {
  debtId: string;
  personId: string;
  personName: string;
  phoneNumber: string | null;
  direction: DebtDirection;
  reason: string | null;
  currency: string;
  originalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  paymentCount: number;
  lastPaymentAt: string | null;
  lentDate: string | null;
  dueDate: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
