import { normalizePersonName } from "@/features/debts/lib/person-name";

import type { PersonListItemView } from "../view-models";
import type { PersonStatus } from "./person-status";

const PERSON_SORT_ORDER: Record<PersonStatus, number> = {
  overdue: 0,
  "due-soon": 1,
  active: 2,
  none: 3,
  settled: 4,
};

/**
 * Smart default order: overdue first, then due-soon, then active by highest
 * remaining, then most recently active; settled people sink to the bottom.
 */
export function sortPeople(people: PersonListItemView[]): PersonListItemView[] {
  return [...people].sort((a, b) => {
    const byStatus = PERSON_SORT_ORDER[a.status] - PERSON_SORT_ORDER[b.status];
    if (byStatus !== 0) {
      return byStatus;
    }
    if (b.outstanding !== a.outstanding) {
      return b.outstanding - a.outstanding;
    }
    if (a.lastActivityAt !== b.lastActivityAt) {
      return a.lastActivityAt < b.lastActivityAt ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });
}

/** Filters by name (accent-folded) or phone digits, then applies the smart sort. */
export function filterAndSortPeople(
  people: PersonListItemView[],
  query: string,
): PersonListItemView[] {
  const normalized = normalizePersonName(query);
  if (normalized.length === 0) {
    return sortPeople(people);
  }

  const digits = query.replace(/\D/g, "");

  const matched = people.filter((person) => {
    if (normalizePersonName(person.name).includes(normalized)) {
      return true;
    }
    if (digits.length > 0 && person.phoneNumber) {
      return person.phoneNumber.replace(/\D/g, "").includes(digits);
    }
    return false;
  });

  return sortPeople(matched);
}
