import type { CardDebtStatus, DebtCardView } from "@/features/debts/view-models";

const ACTIVE_STATUSES = new Set<CardDebtStatus>(["active", "due-soon", "partial"]);

export const DEBT_SORT_ORDER: Record<CardDebtStatus, number> = {
  overdue: 0,
  "due-soon": 1,
  partial: 2,
  active: 3,
  paid: 4,
};

export type DebtTabCounts = {
  all: number;
  active: number;
  overdue: number;
  paid: number;
};

export type HomeDebtBuckets = {
  totalOwed: number;
  activeCount: number;
  paidThisMonth: number;
  overdue: DebtCardView[];
  dueSoon: DebtCardView[];
  activePartial: DebtCardView[];
};

export type DebtFilterKey = "all" | "active" | "overdue" | "paid";

export function computeDebtTabCounts(debts: DebtCardView[]): DebtTabCounts {
  let active = 0;
  let overdue = 0;
  let paid = 0;

  for (const debt of debts) {
    if (debt.status === "paid") {
      paid += 1;
      continue;
    }

    if (debt.status === "overdue") {
      overdue += 1;
    }

    if (ACTIVE_STATUSES.has(debt.status)) {
      active += 1;
    }
  }

  return {
    all: debts.length,
    active,
    overdue,
    paid,
  };
}

function matchesDebtFilter(debt: DebtCardView, filter: DebtFilterKey): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "active") {
    return ACTIVE_STATUSES.has(debt.status);
  }

  if (filter === "overdue") {
    return debt.status === "overdue";
  }

  if (filter === "paid") {
    return debt.status === "paid";
  }

  return true;
}

function matchesDebtSearch(debt: DebtCardView, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  return (
    debt.name.toLowerCase().includes(normalizedQuery) ||
    debt.reason.toLowerCase().includes(normalizedQuery)
  );
}

export function filterDebts(debts: DebtCardView[], filter: DebtFilterKey): DebtCardView[] {
  if (filter === "all") {
    return debts;
  }

  return debts.filter((debt) => matchesDebtFilter(debt, filter));
}

export function filterSearchAndSortDebts(
  debts: DebtCardView[],
  filter: DebtFilterKey,
  searchQuery: string,
): DebtCardView[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const result: DebtCardView[] = [];

  for (const debt of debts) {
    if (!matchesDebtFilter(debt, filter)) {
      continue;
    }

    if (!matchesDebtSearch(debt, normalizedQuery)) {
      continue;
    }

    result.push(debt);
  }

  return sortDebts(result);
}

export function sortDebts(debts: DebtCardView[]): DebtCardView[] {
  return [...debts].sort((a, b) => DEBT_SORT_ORDER[a.status] - DEBT_SORT_ORDER[b.status]);
}

export function bucketHomeDebts(debts: DebtCardView[]): HomeDebtBuckets {
  const overdue: DebtCardView[] = [];
  const dueSoon: DebtCardView[] = [];
  const activePartial: DebtCardView[] = [];

  let totalOwed = 0;
  let activeCount = 0;
  let paidThisMonth = 0;

  for (const debt of debts) {
    if (debt.status === "paid") {
      paidThisMonth += debt.amount;
      continue;
    }

    activeCount += 1;
    totalOwed += debt.remaining;

    if (debt.status === "overdue") {
      overdue.push(debt);
      continue;
    }

    if (debt.status === "due-soon") {
      dueSoon.push(debt);
      continue;
    }

    if (debt.status === "active" || debt.status === "partial") {
      activePartial.push(debt);
    }
  }

  return {
    totalOwed,
    activeCount,
    paidThisMonth,
    overdue,
    dueSoon,
    activePartial,
  };
}
