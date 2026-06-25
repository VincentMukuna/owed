import { useQuery } from "@tanstack/react-query";

import { peopleKeys } from "@/features/debts/hooks/query-keys";

import { fetchPeopleListViews } from "../lib/fetch-people-list";

export function usePeopleList() {
  return useQuery({
    queryKey: peopleKeys.list,
    queryFn: fetchPeopleListViews,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
