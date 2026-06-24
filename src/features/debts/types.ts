export type { DebtStatus } from "@/features/debts/view-models";

export type ActivityType = "payment" | "add" | "overdue" | "paid";

export interface Activity {
  id: number;
  text: string;
  sub: string;
  time: string;
  type: ActivityType;
}
