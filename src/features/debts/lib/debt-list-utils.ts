import { toISODate } from "@/features/debts/lib/format-dates";
import type { CardDebtStatus, DebtCardView } from "@/features/debts/view-models";
import type { SortChoice, SortDirection, SortPreference } from "@/features/view-options/types";
import type { DebtDirection } from "@/types";

import { normalizePersonName } from "./person-name";
import { statusDateParams } from "./status-engine";

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

export type HomeUpcomingSummary = {
  count: number;
  fromDate: string;
  throughDate: string;
  owedToYou: number;
  youOwe: number;
};

export type HomePersonInsight = {
  id: string;
  name: string;
  initials: string;
  currency: string;
  amount: number;
  openDebtCount: number;
  overdueCount: number;
  dueSoonCount: number;
  inactiveDays: number;
};

export type HomeBriefing = {
  totalOwed: number;
  owedToYou: number;
  youOwe: number;
  activeCount: number;
  overdueCount: number;
  dueSoonCount: number;
  attentionDebts: DebtCardView[];
  upcoming: HomeUpcomingSummary;
  peopleInsights: HomePersonInsight[];
};

export const HOME_ATTENTION_DEBT_LIMIT = 5;
export const HOME_PEOPLE_INSIGHT_LIMIT = 2;
export const HOME_UPCOMING_DAYS = 7;
const HOME_STALE_PERSON_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DebtFilterKey = "all" | "active" | "overdue" | "paid" | "paid-this-month" | "due-soon";
export type DebtDirectionFilter = "all" | DebtDirection;
export type DebtDateRangeFilter = {
  from?: string;
  to?: string;
};

export type DebtSortCriterion = "amount" | "attention" | "created" | "due-date" | "person";
export type DebtSortPreference = SortPreference<DebtSortCriterion>;

export const DEFAULT_DEBT_SORT: DebtSortPreference = {
  criterion: "attention",
  direction: "fixed",
};

export const DEBT_SORT_CRITERIA: SortChoice<DebtSortCriterion>[] = [
  { label: "Needs attention", value: "attention" },
  { label: "Promised date", value: "due-date" },
  { label: "Amount remaining", value: "amount" },
  { label: "Recently added", value: "created" },
  { label: "Person", value: "person" },
];

function isSortDirection(value: unknown): value is SortDirection {
  return value === "asc" || value === "desc" || value === "fixed";
}

export function isDebtSortPreference(value: unknown): value is DebtSortPreference {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<DebtSortPreference>;
  const validCriterion = DEBT_SORT_CRITERIA.some((option) => option.value === candidate.criterion);
  if (!validCriterion || !isSortDirection(candidate.direction)) return false;
  return candidate.criterion === "attention"
    ? candidate.direction === "fixed"
    : candidate.direction !== "fixed";
}

export function defaultDebtSortDirection(criterion: DebtSortCriterion): SortDirection {
  if (criterion === "attention") return "fixed";
  if (criterion === "person" || criterion === "due-date") return "asc";
  return "desc";
}

export function debtSortDirections(criterion: DebtSortCriterion): SortChoice<SortDirection>[] {
  if (criterion === "attention") return [];
  if (criterion === "person") {
    return [
      { label: "A-Z", value: "asc" },
      { label: "Z-A", value: "desc" },
    ];
  }
  if (criterion === "due-date") {
    return [
      { label: "Earliest first", value: "asc" },
      { label: "Latest first", value: "desc" },
    ];
  }
  if (criterion === "created") {
    return [
      { label: "Newest first", value: "desc" },
      { label: "Oldest first", value: "asc" },
    ];
  }
  return [
    { label: "Most first", value: "desc" },
    { label: "Least first", value: "asc" },
  ];
}

export function debtSortLabel(preference: DebtSortPreference): string {
  const criterion = DEBT_SORT_CRITERIA.find(
    (option) => option.value === preference.criterion,
  )?.label;
  if (preference.direction === "fixed") return criterion ?? "Needs attention";
  const direction = debtSortDirections(preference.criterion).find(
    (option) => option.value === preference.direction,
  )?.label;
  return direction ? `${criterion} · ${direction}` : (criterion ?? "Needs attention");
}

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
  sortPreference: DebtSortPreference = DEFAULT_DEBT_SORT,
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

  return sortDebtsByPreference(result, sortPreference);
}

function compareDebtName(a: DebtCardView, b: DebtCardView): number {
  return normalizePersonName(a.name).localeCompare(normalizePersonName(b.name));
}

function compareStable(a: DebtCardView, b: DebtCardView): number {
  return compareDebtName(a, b) || a.id.localeCompare(b.id);
}

function compareSettledRecent(a: DebtCardView, b: DebtCardView): number {
  const aSettled = a.lastPaymentAt ?? a.createdAt;
  const bSettled = b.lastPaymentAt ?? b.createdAt;
  return bSettled.localeCompare(aSettled) || compareStable(a, b);
}

function attentionBucket(debt: DebtCardView, today: string, dueSoonEnd: string): number {
  if (debt.remaining <= 0 || debt.status === "paid") return 4;
  if (!debt.dueDateISO) return 3;
  if (debt.dueDateISO < today) return 0;
  if (debt.dueDateISO <= dueSoonEnd) return 1;
  return 2;
}

export function sortDebtsByPreference(
  debts: DebtCardView[],
  preference: DebtSortPreference = DEFAULT_DEBT_SORT,
  now: Date = new Date(),
): DebtCardView[] {
  const [today, , dueSoonEnd] = statusDateParams(now);

  return [...debts].sort((a, b) => {
    if (preference.criterion === "attention") {
      const aBucket = attentionBucket(a, today, dueSoonEnd);
      const bBucket = attentionBucket(b, today, dueSoonEnd);
      if (aBucket !== bBucket) return aBucket - bBucket;
      if (aBucket === 4) return compareSettledRecent(a, b);
      if (aBucket === 3) return b.createdAt.localeCompare(a.createdAt) || compareStable(a, b);
      return a.dueDateISO.localeCompare(b.dueDateISO) || compareStable(a, b);
    }

    if (preference.criterion === "due-date") {
      const aUndated = !a.dueDateISO;
      const bUndated = !b.dueDateISO;
      if (aUndated !== bUndated) return aUndated ? 1 : -1;
      const date = a.dueDateISO.localeCompare(b.dueDateISO);
      return (preference.direction === "desc" ? -date : date) || compareStable(a, b);
    }

    if (preference.criterion === "amount") {
      const aIsZero = a.remaining <= 0;
      const bIsZero = b.remaining <= 0;
      if (aIsZero !== bIsZero) return aIsZero ? 1 : -1;
      if (a.remaining !== b.remaining) {
        return preference.direction === "asc"
          ? a.remaining - b.remaining
          : b.remaining - a.remaining;
      }
      if (aIsZero && bIsZero) return compareSettledRecent(a, b);
      return compareStable(a, b);
    }

    if (preference.criterion === "created") {
      const created = a.createdAt.localeCompare(b.createdAt);
      return (preference.direction === "desc" ? -created : created) || compareStable(a, b);
    }

    const name = compareDebtName(a, b);
    return (preference.direction === "desc" ? -name : name) || a.id.localeCompare(b.id);
  });
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
export function filterDebtsByDueDate(
  debts: DebtCardView[],
  dueDateISO: string,
  sortPreference: DebtSortPreference = DEFAULT_DEBT_SORT,
): DebtCardView[] {
  const result: DebtCardView[] = [];

  for (const debt of debts) {
    if (debt.dueDateISO === dueDateISO && debt.status !== "paid") {
      result.push(debt);
    }
  }

  return sortDebtsByPreference(result, sortPreference);
}

export function filterDebtsNeedingAttention(
  debts: DebtCardView[],
  sortPreference: DebtSortPreference = DEFAULT_DEBT_SORT,
  now: Date = new Date(),
): DebtCardView[] {
  const [, , dueSoonEnd] = statusDateParams(now);
  const result: DebtCardView[] = [];

  for (const debt of debts) {
    if (debt.remaining > 0 && debt.status !== "paid" && debt.dueDateISO <= dueSoonEnd) {
      result.push(debt);
    }
  }

  return sortDebtsByPreference(result, sortPreference, now);
}

type HomePersonAccumulator = HomePersonInsight & {
  earliestDueDate: string;
  lastActivityAt: string;
};

function compareHomeAttention(a: DebtCardView, b: DebtCardView): number {
  return (
    a.dueDateISO.localeCompare(b.dueDateISO) || b.remaining - a.remaining || compareStable(a, b)
  );
}

function compareHomePeople(a: HomePersonAccumulator, b: HomePersonAccumulator): number {
  const aPriority = a.overdueCount > 0 ? 0 : a.dueSoonCount >= 2 ? 1 : 2;
  const bPriority = b.overdueCount > 0 ? 0 : b.dueSoonCount >= 2 ? 1 : 2;

  return (
    aPriority - bPriority ||
    a.earliestDueDate.localeCompare(b.earliestDueDate) ||
    b.amount - a.amount ||
    normalizePersonName(a.name).localeCompare(normalizePersonName(b.name))
  );
}

/**
 * Builds every home signal from the warm debt-summary cache. The debt scan is
 * intentionally single-pass; only the small attention/person candidate sets
 * are sorted afterward.
 */
export function buildHomeBriefing(debts: DebtCardView[], now: Date = new Date()): HomeBriefing {
  const attentionCandidates: DebtCardView[] = [];
  const peopleById = new Map<string, HomePersonAccumulator>();
  const [today, , dueSoonEnd] = statusDateParams(now);
  const upcomingEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  upcomingEndDate.setDate(upcomingEndDate.getDate() + HOME_UPCOMING_DAYS);
  const throughDate = toISODate(upcomingEndDate);
  const staleBefore = new Date(now.getTime() - HOME_STALE_PERSON_DAYS * DAY_MS).toISOString();
  let totalOwed = 0;
  let owedToYou = 0;
  let youOwe = 0;
  let activeCount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  let upcomingCount = 0;
  let upcomingOwedToYou = 0;
  let upcomingYouOwe = 0;

  for (const debt of debts) {
    if (debt.status === "paid" || debt.remaining <= 0) {
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
      overdueCount += 1;
    }

    if (debt.status === "due-soon") {
      dueSoonCount += 1;
    }

    if (debt.dueDateISO <= dueSoonEnd) {
      attentionCandidates.push(debt);
    }

    if (debt.dueDateISO >= today && debt.dueDateISO <= throughDate) {
      upcomingCount += 1;
      if (debt.direction === "they_owe_me") {
        upcomingOwedToYou += debt.remaining;
      } else {
        upcomingYouOwe += debt.remaining;
      }
    }

    if (debt.direction !== "they_owe_me") {
      continue;
    }

    const activityAt = debt.lastPaymentAt ?? debt.createdAt;
    const person = peopleById.get(debt.personId) ?? {
      id: debt.personId,
      name: debt.name,
      initials: debt.initials,
      currency: debt.currency,
      amount: 0,
      openDebtCount: 0,
      overdueCount: 0,
      dueSoonCount: 0,
      inactiveDays: 0,
      earliestDueDate: debt.dueDateISO,
      lastActivityAt: activityAt,
    };

    person.amount += debt.remaining;
    person.openDebtCount += 1;
    person.earliestDueDate =
      debt.dueDateISO < person.earliestDueDate ? debt.dueDateISO : person.earliestDueDate;
    person.lastActivityAt = activityAt > person.lastActivityAt ? activityAt : person.lastActivityAt;
    if (debt.dueDateISO < today) {
      person.overdueCount += 1;
    } else if (debt.dueDateISO <= dueSoonEnd) {
      person.dueSoonCount += 1;
    }
    peopleById.set(debt.personId, person);
  }

  const peopleCandidates: HomePersonAccumulator[] = [];
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const person of peopleById.values()) {
    const isStale = person.lastActivityAt < staleBefore;
    const hasRelationshipSignal =
      person.openDebtCount >= 2 && (person.overdueCount > 0 || person.dueSoonCount >= 2 || isStale);

    if (!hasRelationshipSignal) {
      continue;
    }

    const lastActivityTime = new Date(person.lastActivityAt).getTime();
    person.inactiveDays = Number.isNaN(lastActivityTime)
      ? 0
      : Math.max(0, Math.floor((startOfToday - lastActivityTime) / DAY_MS));
    peopleCandidates.push(person);
  }

  return {
    totalOwed,
    owedToYou,
    youOwe,
    activeCount,
    overdueCount,
    dueSoonCount,
    attentionDebts: attentionCandidates
      .sort(compareHomeAttention)
      .slice(0, HOME_ATTENTION_DEBT_LIMIT),
    upcoming: {
      count: upcomingCount,
      fromDate: today,
      throughDate,
      owedToYou: upcomingOwedToYou,
      youOwe: upcomingYouOwe,
    },
    peopleInsights: peopleCandidates
      .sort(compareHomePeople)
      .slice(0, HOME_PEOPLE_INSIGHT_LIMIT)
      .map(
        ({ earliestDueDate: _earliestDueDate, lastActivityAt: _lastActivityAt, ...person }) =>
          person,
      ),
  };
}
