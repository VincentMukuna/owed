import { useQuery } from "@tanstack/react-query";

import { toDebtCardView } from "@/features/debts/lib/mappers";
import { debtRepository } from "@/features/debts/repositories/debt-repository";

import { debtKeys } from "./query-keys";

export function useDebts() {
  return useQuery({
    queryKey: debtKeys.all,
    queryFn: async () => {
      const debts = await debtRepository.list();
      return debts.map((debt) => toDebtCardView(debt));
    },
  });
}
