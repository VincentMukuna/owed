import type { QueryClient } from "@tanstack/react-query";

import { peopleKeys } from "@/features/debts/hooks/query-keys";

/** Refreshes people picker and list caches after a person-only write. */
export async function afterPersonListChange(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: peopleKeys.all }),
    queryClient.invalidateQueries({ queryKey: peopleKeys.list }),
  ]);
}
