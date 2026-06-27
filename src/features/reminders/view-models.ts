import type { ReminderType } from "@/types";

export type ReminderInboxView = {
  id: string;
  debtId: string;
  type: ReminderType;
  title: string;
  body: string;
  time: string;
};
