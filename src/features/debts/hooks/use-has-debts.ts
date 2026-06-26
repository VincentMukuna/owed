import { useQuery } from "@tanstack/react-query";

import { fetchHasDebts } from "@/features/debts/lib/fetch-has-debts";

import { debtKeys } from "./query-keys";

export function useHasDebts() {
  return useQuery({
    queryKey: debtKeys.presence,
    queryFn: fetchHasDebts,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
