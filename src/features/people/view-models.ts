import type { ActivityView, DebtCardView } from "@/features/debts/view-models";

import type { PersonStatus } from "./lib/person-status";

export type { PersonStatus };

export type PersonListItemView = {
  id: string;
  name: string;
  initials: string;
  phoneNumber?: string;
  outstanding: number;
  owedToYou: number;
  youOwe: number;
  openDebtCount: number;
  owedToYouOpenCount: number;
  youOweOpenCount: number;
  overdueCount: number;
  earliestOverdueDate?: string;
  owedToYouOverdueCount: number;
  youOweOverdueCount: number;
  dueSoonCount: number;
  earliestDueSoonDate?: string;
  owedToYouDueSoonCount: number;
  youOweDueSoonCount: number;
  status: PersonStatus;
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
  owedToYou: number;
  youOwe: number;
  originalTotal: number;
  status: PersonStatus;
  openDebtCount: number;
  owedToYouOpenCount: number;
  youOweOpenCount: number;
  overdueCount: number;
  owedToYouOverdueCount: number;
  youOweOverdueCount: number;
  dueSoonCount: number;
  owedToYouDueSoonCount: number;
  youOweDueSoonCount: number;
  paidCount: number;
  debts: DebtCardView[];
  payments: ActivityView[];
};
