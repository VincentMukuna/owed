import { useQuery } from "@tanstack/react-query";

import { peopleKeys } from "@/features/debts/hooks/query-keys";

import { fetchPersonDetail } from "../lib/fetch-person-detail";

export function usePersonDetail(id: string | undefined) {
  return useQuery({
    queryKey: peopleKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) {
        return undefined;
      }
      return fetchPersonDetail(id);
    },
    enabled: Boolean(id),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
