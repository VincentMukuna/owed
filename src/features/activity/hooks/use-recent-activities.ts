import { useQuery } from "@tanstack/react-query";

import { fetchRecentActivityViews } from "@/features/activity/lib/fetch-activities";
import { activityKeys } from "@/features/debts/hooks/query-keys";

export function useRecentActivities(limit: number) {
  return useQuery({
    queryKey: activityKeys.recent(limit),
    queryFn: () => fetchRecentActivityViews(limit),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
