import { useQuery } from "@tanstack/react-query";

import { buildActivityView } from "@/features/debts/lib/build-activity-view";
import { activityRepository } from "@/features/debts/repositories/activity-repository";

import { activityKeys } from "./query-keys";

export function useActivities() {
  return useQuery({
    queryKey: activityKeys.all,
    queryFn: async () => {
      const events = await activityRepository.list();
      return events.map((event) => buildActivityView(event));
    },
  });
}
