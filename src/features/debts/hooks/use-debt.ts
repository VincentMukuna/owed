import { useQuery } from "@tanstack/react-query";

import { toDebtDetailView } from "@/features/debts/lib/mappers";
import { debtRepository } from "@/features/debts/repositories/debt-repository";

import { debtKeys } from "./query-keys";

export function useDebt(id: string | undefined) {
  return useQuery({
    queryKey: debtKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) {
        return undefined;
      }

      const debt = await debtRepository.getById(id);

      if (!debt) {
        return undefined;
      }

      return toDebtDetailView(debt);
    },
    enabled: Boolean(id),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
