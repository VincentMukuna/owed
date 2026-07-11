import { normalizePersonName } from "@/features/debts/lib/person-name";

import type { PersonListItemView } from "../view-models";

/** Alphabetical order by name (accent-folded for consistent sorting). */
export function sortPeople(people: PersonListItemView[]): PersonListItemView[] {
  return [...people].sort((a, b) =>
    normalizePersonName(a.name).localeCompare(normalizePersonName(b.name)),
  );
}

/** Filters by name (accent-folded) or phone digits, then sorts alphabetically. */
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
