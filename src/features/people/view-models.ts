import type { ActivityView, DebtCardView } from "@/features/debts/view-models";

import type { PersonStatus } from "./lib/person-status";

export type { PersonStatus };

export type PersonListItemView = {
  id: string;
  name: string;
  initials: string;
  phoneNumber?: string;
  outstanding: number;
  openDebtCount: number;
  overdueCount: number;
  dueSoonCount: number;
  status: PersonStatus;
  /** Display label, e.g. "Yesterday". */
  lastActivity: string;
  /** ISO timestamp for sorting. */
  lastActivityAt: string;
};

export type PersonDetailView = {
  id: string;
  name: string;
  initials: string;
  phoneNumber?: string;
  notes?: string;
  outstanding: number;
  originalTotal: number;
  status: PersonStatus;
  openDebtCount: number;
  overdueCount: number;
  dueSoonCount: number;
  paidCount: number;
  activeDebts: DebtCardView[];
  settledDebts: DebtCardView[];
  payments: ActivityView[];
};
