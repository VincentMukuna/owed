/**
 * Person-level status, rolled up from a person's debts. Timing-based by design:
 * a partially-paid debt that is past due still flags the person as Overdue
 * (debt-level status uses "partial" instead, but person status is about which
 * relationships need attention). Priority: Overdue > Due soon > Active > Settled.
 * "none" is a manually-added person with no (non-archived) debts yet.
 */
export type PersonStatus = "overdue" | "due-soon" | "active" | "settled" | "none";

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  overdue: "Overdue",
  "due-soon": "Due soon",
  active: "Active",
  settled: "Settled",
  none: "No debts",
};

export function derivePersonStatus(input: {
  overdueCount: number;
  dueSoonCount: number;
  openDebtCount: number;
  totalDebtCount: number;
}): PersonStatus {
  if (input.totalDebtCount === 0) {
    return "none";
  }
  if (input.overdueCount > 0) {
    return "overdue";
  }
  if (input.dueSoonCount > 0) {
    return "due-soon";
  }
  if (input.openDebtCount > 0) {
    return "active";
  }
  return "settled";
}
