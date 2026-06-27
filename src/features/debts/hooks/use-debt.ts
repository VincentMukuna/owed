import { useQuery } from "@tanstack/react-query";

import { toDebtDetailView } from "@/features/debts/lib/mappers";
import { debtRepository } from "@/features/debts/repositories/debt-repository";

import { debtKeys } from "./query-keys";

export async function loadDebt(id: string) {
  const debt = await debtRepository.getById(id);

  if (!debt) {
    return undefined;
  }

  return toDebtDetailView(debt, new Date());
}

export function useDebt(id: string | undefined) {
  return useQuery({
    queryKey: debtKeys.detail(id ?? ""),
    queryFn: () => {
      if (!id) {
        return undefined;
      }

      return loadDebt(id);
    },
    enabled: Boolean(id),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
