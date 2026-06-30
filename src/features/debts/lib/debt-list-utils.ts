import type { CardDebtStatus, DebtCardView } from "@/features/debts/view-models";
import type { DebtDirection } from "@/types";

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
  paidThisMonth: number;
};

export type DebtDirectionCounts = {
  all: number;
  they_owe_me: number;
  i_owe_them: number;
};

export type HomeDebtBuckets = {
  totalOwed: number;
  owedToYou: number;
  youOwe: number;
  activeCount: number;
  overdue: DebtCardView[];
  dueSoon: DebtCardView[];
  activePartial: DebtCardView[];
};

export type DebtFilterKey = "all" | "active" | "overdue" | "paid" | "paid-this-month" | "due-soon";
export type DebtDirectionFilter = "all" | DebtDirection;
export type DebtDateRangeFilter = {
  from?: string;
  to?: string;
};

function monthBounds(now: Date = new Date()): { start: string; end: string } {
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
  };
}

function matchesDebtDirection(debt: DebtCardView, direction: DebtDirectionFilter): boolean {
  return direction === "all" || debt.direction === direction;
}

function matchesDebtDateRange(debt: DebtCardView, dateRange?: DebtDateRangeFilter): boolean {
  if (!dateRange?.from && !dateRange?.to) {
    return true;
  }

  if (dateRange.from && debt.dueDateISO < dateRange.from) {
    return false;
  }

  if (dateRange.to && debt.dueDateISO > dateRange.to) {
    return false;
  }

  return true;
}

function wasPaidThisMonth(debt: DebtCardView, now?: Date): boolean {
  if (!debt.lastPaymentAt) {
    return false;
  }

  const bounds = monthBounds(now);
  return (
    debt.status === "paid" && debt.lastPaymentAt >= bounds.start && debt.lastPaymentAt < bounds.end
  );
}

export function computeDebtDirectionCounts(
  debts: DebtCardView[],
  dateRange?: DebtDateRangeFilter,
): DebtDirectionCounts {
  let theyOweMe = 0;
  let iOweThem = 0;
  let all = 0;

  for (const debt of debts) {
    if (!matchesDebtDateRange(debt, dateRange)) {
      continue;
    }

    all += 1;

    if (debt.direction === "they_owe_me") {
      theyOweMe += 1;
    } else {
      iOweThem += 1;
    }
  }

  return {
    all,
    they_owe_me: theyOweMe,
    i_owe_them: iOweThem,
  };
}

export function computeDebtTabCounts(
  debts: DebtCardView[],
  direction: DebtDirectionFilter = "all",
  dateRange?: DebtDateRangeFilter,
): DebtTabCounts {
  let active = 0;
  let overdue = 0;
  let paid = 0;
  let paidThisMonth = 0;
  let all = 0;

  for (const debt of debts) {
    if (!matchesDebtDirection(debt, direction) || !matchesDebtDateRange(debt, dateRange)) {
      continue;
    }

    all += 1;

    if (debt.status === "paid") {
      paid += 1;
      if (wasPaidThisMonth(debt)) {
        paidThisMonth += 1;
      }
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
    all,
    active,
    overdue,
    paid,
    paidThisMonth,
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

  if (filter === "paid-this-month") {
    return wasPaidThisMonth(debt);
  }

  if (filter === "due-soon") {
    return debt.status === "due-soon";
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

export function filterDebts(
  debts: DebtCardView[],
  filter: DebtFilterKey,
  direction: DebtDirectionFilter = "all",
): DebtCardView[] {
  if (filter === "all") {
    return direction === "all"
      ? debts
      : debts.filter((debt) => matchesDebtDirection(debt, direction));
  }

  return debts.filter(
    (debt) => matchesDebtDirection(debt, direction) && matchesDebtFilter(debt, filter),
  );
}

export function filterSearchAndSortDebts(
  debts: DebtCardView[],
  filter: DebtFilterKey,
  searchQuery: string,
  direction: DebtDirectionFilter = "all",
  dateRange?: DebtDateRangeFilter,
): DebtCardView[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const result: DebtCardView[] = [];

  for (const debt of debts) {
    if (!matchesDebtDirection(debt, direction)) {
      continue;
    }

    if (!matchesDebtDateRange(debt, dateRange)) {
      continue;
    }

    if (!matchesDebtFilter(debt, filter)) {
      continue;
    }

    if (!matchesDebtSearch(debt, normalizedQuery)) {
      continue;
    }

    result.push(debt);
  }

  return filter === "all" ? sortDebtsByDueDate(result) : sortDebts(result);
}

export function sortDebts(debts: DebtCardView[]): DebtCardView[] {
  return [...debts].sort((a, b) => DEBT_SORT_ORDER[a.status] - DEBT_SORT_ORDER[b.status]);
}

export function sortDebtsByDueDate(debts: DebtCardView[]): DebtCardView[] {
  return [...debts].sort((a, b) => {
    const byDate = a.dueDateISO.localeCompare(b.dueDateISO);

    if (byDate !== 0) {
      return byDate;
    }

    return a.name.localeCompare(b.name);
  });
}

/**
 * Debts promised on a specific due date that are still unpaid — used by the
 * transient focused view opened from a collapsed reminder notification.
 */
export function filterDebtsByDueDate(debts: DebtCardView[], dueDateISO: string): DebtCardView[] {
  const result: DebtCardView[] = [];

  for (const debt of debts) {
    if (debt.dueDateISO === dueDateISO && debt.status !== "paid") {
      result.push(debt);
    }
  }

  return sortDebts(result);
}

export function bucketHomeDebts(debts: DebtCardView[]): HomeDebtBuckets {
  const overdue: DebtCardView[] = [];
  const dueSoon: DebtCardView[] = [];
  const activePartial: DebtCardView[] = [];

  let totalOwed = 0;
  let owedToYou = 0;
  let youOwe = 0;
  let activeCount = 0;

  for (const debt of debts) {
    if (debt.status === "paid") {
      continue;
    }

    activeCount += 1;
    totalOwed += debt.remaining;
    if (debt.direction === "they_owe_me") {
      owedToYou += debt.remaining;
    } else {
      youOwe += debt.remaining;
    }

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
    owedToYou,
    youOwe,
    activeCount,
    overdue,
    dueSoon,
    activePartial,
  };
}
