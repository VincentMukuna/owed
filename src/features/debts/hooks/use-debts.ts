import { useQuery } from "@tanstack/react-query";

import { toDebtCardView } from "@/features/debts/lib/mappers";
import { debtRepository } from "@/features/debts/repositories/debt-repository";

import { debtKeys } from "./query-keys";

export async function loadDebts() {
  const now = new Date();
  const summaries = await debtRepository.listSummaries();

  return summaries.map((debt) => toDebtCardView(debt, now));
}

export function useDebts() {
  return useQuery({
    queryKey: debtKeys.all,
    queryFn: loadDebts,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
