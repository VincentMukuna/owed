import { personRepository } from "@/features/debts/repositories/person-repository";
import type { PersonPickerView } from "@/features/debts/view-models";
import { getInitials } from "@/lib/utils/formatters";

export async function fetchPeoplePickerViews(): Promise<PersonPickerView[]> {
  const people = await personRepository.listSummaries();

  return people.map((person) => ({
    id: person.id,
    name: person.name,
    initials: getInitials(person.name),
    outstanding: person.outstanding,
    openDebtCount: person.openDebtCount,
  }));
}
