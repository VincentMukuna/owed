import { useQuery } from "@tanstack/react-query";

import { personRepository } from "@/features/debts/repositories/person-repository";
import { getInitials } from "@/lib/utils/formatters";

import { peopleKeys } from "./query-keys";

export async function loadPeoplePicker() {
  const people = await personRepository.listSummaries();

  return people.map((person) => ({
    id: person.id,
    name: person.name,
    initials: getInitials(person.name),
    outstanding: person.outstanding,
    openDebtCount: person.openDebtCount,
  }));
}

export function usePeople() {
  return useQuery({
    queryKey: peopleKeys.all,
    queryFn: loadPeoplePicker,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
