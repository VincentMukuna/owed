import { useQuery } from "@tanstack/react-query";

import { peopleKeys } from "@/features/debts/hooks/query-keys";
import { personRepository } from "@/features/debts/repositories/person-repository";
import { derivePersonStatus } from "@/features/people/lib/person-status";
import type { PersonListItemView } from "@/features/people/view-models";
import { getInitials } from "@/lib/utils/formatters";

export async function loadPeopleList(): Promise<PersonListItemView[]> {
  const people = await personRepository.listSummaries();

  return people.map((person) => ({
    id: person.id,
    name: person.name,
    initials: getInitials(person.name),
    phoneNumber: person.phoneNumber,
    outstanding: person.outstanding,
    owedToYou: person.owedToYou,
    youOwe: person.youOwe,
    openDebtCount: person.openDebtCount,
    owedToYouOpenCount: person.owedToYouOpenCount,
    youOweOpenCount: person.youOweOpenCount,
    overdueCount: person.overdueCount,
    earliestOverdueDate: person.earliestOverdueDate,
    owedToYouOverdueCount: person.owedToYouOverdueCount,
    youOweOverdueCount: person.youOweOverdueCount,
    dueSoonCount: person.dueSoonCount,
    earliestDueSoonDate: person.earliestDueSoonDate,
    owedToYouDueSoonCount: person.owedToYouDueSoonCount,
    youOweDueSoonCount: person.youOweDueSoonCount,
    status: derivePersonStatus(person),
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
