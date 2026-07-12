import { useInfiniteQuery } from "@tanstack/react-query";

import { ACTIVITY_PAGE_SIZE } from "@/features/activity/constants";
import { activityKeys } from "@/features/debts/hooks/query-keys";
import { buildActivityView } from "@/features/debts/lib/build-activity-view";
import {
  type ActivityPageCursor,
  activityRepository,
} from "@/features/debts/repositories/activity-repository";
import type { ActivityView } from "@/features/debts/view-models";

export type ActivityPage = {
  items: ActivityView[];
  nextCursor: ActivityPageCursor | undefined;
};

export async function loadActivityPage(
  cursor: ActivityPageCursor | undefined,
): Promise<ActivityPage> {
  const now = new Date();
  const events = await activityRepository.listPage(ACTIVITY_PAGE_SIZE, cursor);
  const items = events.map((event) => buildActivityView(event, now));
  const last = events.at(-1);

  const nextCursor =
    events.length === ACTIVITY_PAGE_SIZE && last
      ? { occurredAt: last.occurredAt, id: last.id }
      : undefined;

  return { items, nextCursor };
}

export function useActivities() {
  return useInfiniteQuery({
    queryKey: activityKeys.infinite(),
    queryFn: ({ pageParam }) => loadActivityPage(pageParam),
    initialPageParam: undefined as ActivityPageCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
