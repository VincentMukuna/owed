import { useQuery } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";

import { debtKeys } from "./query-keys";

export function useHasDebts() {
  return useQuery({
    queryKey: debtKeys.presence,
    queryFn: () => debtRepository.hasAnyDebts(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
