export type DebtStatus = "active" | "due-soon" | "overdue" | "partial" | "paid" | "archived";

export type ReminderStatus = "scheduled" | "sent" | "cancelled";

export type ReminderType = "due" | "overdue";

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  defaultCurrency: string;
  defaultReminderTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  userId: string;
  name: string;
  phoneNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  personId: string;
  personName: string;
  originalAmount: number;
  remainingAmount: number;
  currency: string;
  reason?: string;
  dueDate: string;
  lentDate?: string;
  status: DebtStatus;
  reminderEnabled: boolean;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  paidAt: string;
  note?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  debtId: string;
  type: ReminderType;
  remindAt: string;
  status: ReminderStatus;
  notificationId?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityEventType = "debt_created" | "payment_recorded" | "debt_paid";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  debtId: string;
  paymentId?: string;
  personId: string;
  amount?: number;
  occurredAt: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: "payment" | "add" | "overdue" | "paid" | "update";
  text: string;
  sub?: string;
  time: string;
  debtId?: string;
}
