import { useQuery } from "@tanstack/react-query";

import { peopleKeys } from "@/features/debts/hooks/query-keys";
import { buildActivityView } from "@/features/debts/lib/build-activity-view";
import { toDebtCardView } from "@/features/debts/lib/mappers";
import { personRepository } from "@/features/debts/repositories/person-repository";
import { derivePersonStatus } from "@/features/people/lib/person-status";
import { getInitials } from "@/lib/utils/formatters";

export async function loadPersonDetail(personId: string) {
  const data = await personRepository.getDetailData(personId);

  if (!data) {
    return undefined;
  }

  const now = new Date();
  const cards = data.debts.map((debt) => toDebtCardView(debt, now));

  return {
    id: data.person.id,
    name: data.person.name,
    initials: getInitials(data.person.name),
    phoneNumber: data.person.phoneNumber,
    notes: data.person.notes,
    outstanding: data.summary.outstanding,
    originalTotal: data.summary.originalTotal,
    status: derivePersonStatus(data.summary),
    openDebtCount: data.summary.openDebtCount,
    overdueCount: data.summary.overdueCount,
    dueSoonCount: data.summary.dueSoonCount,
    paidCount: data.summary.paidDebtCount,
    activeDebts: cards.filter((card) => card.status !== "paid"),
    settledDebts: cards.filter((card) => card.status === "paid"),
    payments: data.events.map((event) => buildActivityView(event, now)),
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
