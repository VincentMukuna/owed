import { useQuery } from "@tanstack/react-query";

import { fetchActivityViews } from "@/features/activity/lib/fetch-activities";

import { activityKeys } from "../../debts/hooks/query-keys";

export function useActivities() {
  return useQuery({
    queryKey: activityKeys.all,
    queryFn: fetchActivityViews,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
