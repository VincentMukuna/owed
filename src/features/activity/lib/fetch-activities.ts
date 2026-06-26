import { buildActivityView } from "@/features/debts/lib/build-activity-view";
import { activityRepository } from "@/features/debts/repositories/activity-repository";
import type { ActivityView } from "@/features/debts/view-models";

export async function fetchActivityViews(): Promise<ActivityView[]> {
  const now = new Date();
  const events = await activityRepository.list();

  return events.map((event) => buildActivityView(event, now));
}
