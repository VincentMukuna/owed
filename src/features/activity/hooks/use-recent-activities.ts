import { useQuery } from "@tanstack/react-query";

import { activityKeys } from "@/features/debts/hooks/query-keys";
import { buildActivityView } from "@/features/debts/lib/build-activity-view";
import { activityRepository } from "@/features/debts/repositories/activity-repository";

export async function loadRecentActivities(limit: number) {
  const now = new Date();
  const events = await activityRepository.listRecent(limit);

  return events.map((event) => buildActivityView(event, now));
}

export function useRecentActivities(limit: number) {
  return useQuery({
    queryKey: activityKeys.recent(limit),
    queryFn: () => loadRecentActivities(limit),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
