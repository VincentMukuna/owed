import { useQuery } from "@tanstack/react-query";

import { peopleKeys } from "@/features/debts/hooks/query-keys";
import { buildActivityView } from "@/features/debts/lib/build-activity-view";
import { toDebtCardView } from "@/features/debts/lib/mappers";
import { activityRepository } from "@/features/debts/repositories/activity-repository";
import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { personRepository } from "@/features/debts/repositories/person-repository";
import { derivePersonStatus } from "@/features/people/lib/person-status";
import { getInitials } from "@/lib/utils/formatters";

export async function loadPersonDetail(personId: string) {
  const [person, summary, debts, events] = await Promise.all([
    personRepository.getById(personId),
    personRepository.getSummary(personId),
    debtRepository.listSummariesForPerson(personId),
    activityRepository.listForPerson(personId),
  ]);

  if (!person || !summary) {
    return undefined;
  }

  const now = new Date();
  const cards = debts.map((debt) => toDebtCardView(debt, now));

  return {
    id: person.id,
    name: person.name,
    initials: getInitials(person.name),
    phoneNumber: person.phoneNumber,
    notes: person.notes,
    outstanding: summary.outstanding,
    originalTotal: summary.originalTotal,
    status: derivePersonStatus(summary),
    openDebtCount: summary.openDebtCount,
    overdueCount: summary.overdueCount,
    dueSoonCount: summary.dueSoonCount,
    paidCount: summary.paidDebtCount,
    activeDebts: cards.filter((card) => card.status !== "paid"),
    settledDebts: cards.filter((card) => card.status === "paid"),
    payments: events.map((event) => buildActivityView(event, now)),
  };
}

export function usePersonDetail(id: string | undefined) {
  return useQuery({
    queryKey: peopleKeys.detail(id ?? ""),
    queryFn: () => {
      if (!id) {
        return undefined;
      }

      return loadPersonDetail(id);
    },
    enabled: Boolean(id),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
