import { useQuery } from "@tanstack/react-query";

import { fetchPeoplePickerViews } from "@/features/debts/lib/fetch-people";

import { peopleKeys } from "./query-keys";

export function usePeople() {
  return useQuery({
    queryKey: peopleKeys.all,
    queryFn: fetchPeoplePickerViews,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
