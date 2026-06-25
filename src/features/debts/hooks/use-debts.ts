import { useQuery } from "@tanstack/react-query";

import { fetchDebtCardViews } from "@/features/debts/lib/fetch-debts";

import { debtKeys } from "./query-keys";

export function useDebts() {
  return useQuery({
    queryKey: debtKeys.all,
    queryFn: fetchDebtCardViews,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
