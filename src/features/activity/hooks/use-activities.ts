import { useQuery } from "@tanstack/react-query";

import { activityKeys } from "@/features/debts/hooks/query-keys";
import { buildActivityView } from "@/features/debts/lib/build-activity-view";
import { activityRepository } from "@/features/debts/repositories/activity-repository";

export async function loadActivities() {
  const now = new Date();
  const events = await activityRepository.list();

  return events.map((event) => buildActivityView(event, now));
}

export function useActivities() {
  return useQuery({
    queryKey: activityKeys.all,
    queryFn: loadActivities,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
