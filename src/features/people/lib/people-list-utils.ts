import { normalizePersonName } from "@/features/debts/lib/person-name";
import type { SortChoice, SortDirection, SortPreference } from "@/features/view-options/types";

import type { PersonListItemView, PersonStatus } from "../view-models";

export type PeopleSortCriterion = "attention" | "name" | "owed-to-you" | "recent" | "you-owe";
export type PeopleSortPreference = SortPreference<PeopleSortCriterion>;

export const DEFAULT_PEOPLE_SORT: PeopleSortPreference = {
  criterion: "attention",
  direction: "fixed",
};

export const PEOPLE_SORT_CRITERIA: SortChoice<PeopleSortCriterion>[] = [
  { label: "Needs attention", value: "attention" },
  { label: "Name", value: "name" },
  { label: "Recently active", value: "recent" },
  { label: "Owes you", value: "owed-to-you" },
  { label: "You owe", value: "you-owe" },
];

const PEOPLE_STATUS_PRIORITY: Record<PersonStatus, number> = {
  overdue: 0,
  "due-soon": 1,
  active: 2,
  settled: 3,
  none: 3,
};

function isSortDirection(value: unknown): value is SortDirection {
  return value === "asc" || value === "desc" || value === "fixed";
}

export function isPeopleSortPreference(value: unknown): value is PeopleSortPreference {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<PeopleSortPreference>;
  const validCriterion = PEOPLE_SORT_CRITERIA.some(
    (option) => option.value === candidate.criterion,
  );
  if (!validCriterion || !isSortDirection(candidate.direction)) {
    return false;
  }

  return candidate.criterion === "attention"
    ? candidate.direction === "fixed"
    : candidate.direction !== "fixed";
}

export function defaultPeopleSortDirection(criterion: PeopleSortCriterion): SortDirection {
  if (criterion === "attention") return "fixed";
  if (criterion === "name") return "asc";
  return "desc";
}

export function peopleSortDirections(criterion: PeopleSortCriterion): SortChoice<SortDirection>[] {
  if (criterion === "attention") return [];
  if (criterion === "name") {
    return [
      { label: "A-Z", value: "asc" },
      { label: "Z-A", value: "desc" },
    ];
  }
  if (criterion === "recent") {
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

export function peopleSortLabel(preference: PeopleSortPreference): string {
  const criterion = PEOPLE_SORT_CRITERIA.find(
    (option) => option.value === preference.criterion,
  )?.label;
  if (preference.direction === "fixed") return criterion ?? "Needs attention";

  const direction = peopleSortDirections(preference.criterion).find(
    (option) => option.value === preference.direction,
  )?.label;
  return direction ? `${criterion} · ${direction}` : (criterion ?? "Needs attention");
}

function compareName(a: PersonListItemView, b: PersonListItemView): number {
  return normalizePersonName(a.name).localeCompare(normalizePersonName(b.name));
}

function compareRecentThenName(a: PersonListItemView, b: PersonListItemView): number {
  return b.lastActivityAt.localeCompare(a.lastActivityAt) || compareName(a, b);
}

function comparePositiveAmount(
  a: PersonListItemView,
  b: PersonListItemView,
  value: (person: PersonListItemView) => number,
  direction: SortDirection,
): number {
  const aValue = value(a);
  const bValue = value(b);
  const aIsZero = aValue <= 0;
  const bIsZero = bValue <= 0;

  if (aIsZero !== bIsZero) return aIsZero ? 1 : -1;
  if (aValue !== bValue) return direction === "asc" ? aValue - bValue : bValue - aValue;
  return compareRecentThenName(a, b);
}

function compareNeedsAttention(a: PersonListItemView, b: PersonListItemView): number {
  const priority = PEOPLE_STATUS_PRIORITY[a.status] - PEOPLE_STATUS_PRIORITY[b.status];
  if (priority !== 0) return priority;

  if (a.status === "overdue" && b.status === "overdue") {
    const date = (a.earliestOverdueDate ?? "9999-12-31").localeCompare(
      b.earliestOverdueDate ?? "9999-12-31",
    );
    if (date !== 0) return date;
    return compareName(a, b);
  }

  if (a.status === "due-soon" && b.status === "due-soon") {
    const date = (a.earliestDueSoonDate ?? "9999-12-31").localeCompare(
      b.earliestDueSoonDate ?? "9999-12-31",
    );
    if (date !== 0) return date;
    return compareName(a, b);
  }

  if (a.status === "active" && b.status === "active") {
    const balance = Math.max(b.owedToYou, b.youOwe) - Math.max(a.owedToYou, a.youOwe);
    if (balance !== 0) return balance;
    return compareName(a, b);
  }

  return compareRecentThenName(a, b);
}

export function sortPeople(
  people: PersonListItemView[],
  preference: PeopleSortPreference = DEFAULT_PEOPLE_SORT,
): PersonListItemView[] {
  return [...people].sort((a, b) => {
    if (preference.criterion === "attention") return compareNeedsAttention(a, b);

    if (preference.criterion === "name") {
      const name = compareName(a, b);
      return preference.direction === "desc" ? -name : name;
    }

    if (preference.criterion === "recent") {
      const recent = a.lastActivityAt.localeCompare(b.lastActivityAt);
      const ordered = preference.direction === "desc" ? -recent : recent;
      return ordered || compareName(a, b);
    }

    return comparePositiveAmount(
      a,
      b,
      preference.criterion === "owed-to-you"
        ? (person) => person.owedToYou
        : (person) => person.youOwe,
      preference.direction,
    );
  });
}

/** Filters by name (accent-folded) or phone digits, then applies the selected order. */
export function filterAndSortPeople(
  people: PersonListItemView[],
  query: string,
  preference: PeopleSortPreference = DEFAULT_PEOPLE_SORT,
): PersonListItemView[] {
  const normalized = normalizePersonName(query);
  if (normalized.length === 0) {
    return sortPeople(people, preference);
  }

  const digits = query.replace(/\D/g, "");
  const matched: PersonListItemView[] = [];

  for (const person of people) {
    if (normalizePersonName(person.name).includes(normalized)) {
      matched.push(person);
      continue;
    }
    if (digits.length > 0 && person.phoneNumber) {
      if (person.phoneNumber.replace(/\D/g, "").includes(digits)) {
        matched.push(person);
      }
    }
  }

  return sortPeople(matched, preference);
}
