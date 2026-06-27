import { useQuery } from "@tanstack/react-query";

import { debtRepository } from "@/features/debts/repositories/debt-repository";

import { debtKeys } from "./query-keys";

export async function loadPaidThisMonth() {
  return debtRepository.sumPaymentsInMonth(new Date());
}

export function usePaidThisMonth() {
  return useQuery({
    queryKey: debtKeys.paidThisMonth,
    queryFn: loadPaidThisMonth,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
