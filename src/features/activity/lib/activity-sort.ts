import type { SortChoice } from "@/features/view-options/types";

export type ActivitySortCriterion = "chronology";
export type ActivitySortPreference = {
  criterion: ActivitySortCriterion;
  direction: "asc" | "desc";
};

export const DEFAULT_ACTIVITY_SORT: ActivitySortPreference = {
  criterion: "chronology",
  direction: "desc",
};

export const ACTIVITY_SORT_CRITERIA: SortChoice<ActivitySortCriterion>[] = [
  { label: "Chronology", value: "chronology" },
];

export const ACTIVITY_SORT_DIRECTIONS: SortChoice<ActivitySortPreference["direction"]>[] = [
  { label: "Newest first", value: "desc" },
  { label: "Oldest first", value: "asc" },
];

export function isActivitySortPreference(value: unknown): value is ActivitySortPreference {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ActivitySortPreference>;
  return (
    candidate.criterion === "chronology" &&
    (candidate.direction === "asc" || candidate.direction === "desc")
  );
}

export function activitySortLabel(preference: ActivitySortPreference): string {
  return preference.direction === "asc" ? "Oldest first" : "Newest first";
}
