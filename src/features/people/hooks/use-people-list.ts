import { useQuery } from "@tanstack/react-query";

import { peopleKeys } from "@/features/debts/hooks/query-keys";
import { formatRelativeDay } from "@/features/debts/lib/format-dates";
import { personRepository } from "@/features/debts/repositories/person-repository";
import { derivePersonStatus } from "@/features/people/lib/person-status";
import type { PersonListItemView } from "@/features/people/view-models";
import { getInitials } from "@/lib/utils/formatters";

export async function loadPeopleList(): Promise<PersonListItemView[]> {
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

export function usePeopleList() {
  return useQuery({
    queryKey: peopleKeys.list,
    queryFn: loadPeopleList,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
