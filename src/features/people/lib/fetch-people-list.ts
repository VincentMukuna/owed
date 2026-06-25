import { formatRelativeDay } from "@/features/debts/lib/format-dates";
import { personRepository } from "@/features/debts/repositories/person-repository";
import { getInitials } from "@/lib/utils/formatters";

import type { PersonListItemView } from "../view-models";
import { derivePersonStatus } from "./person-status";

/**
 * Everyone, shaped for the People list. Manually-added people with no debts
 * yet surface as "none". Status is timing-based (see {@link derivePersonStatus});
 * sorting happens in the screen so search can re-rank without refetching.
 */
export async function fetchPeopleListViews(): Promise<PersonListItemView[]> {
  const now = new Date();
  const people = await personRepository.listSummaries();

  return people.map((person) => ({
    id: person.id,
    name: person.name,
    initials: getInitials(person.name),
    phoneNumber: person.phoneNumber,
    outstanding: person.outstanding,
    openDebtCount: person.openDebtCount,
    overdueCount: person.overdueCount,
    dueSoonCount: person.dueSoonCount,
    status: derivePersonStatus(person),
    lastActivity: formatRelativeDay(person.lastActivityAt, now),
    lastActivityAt: person.lastActivityAt,
  }));
}
