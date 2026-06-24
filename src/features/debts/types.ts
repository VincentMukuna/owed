export type DebtStatus = "active" | "due-soon" | "overdue" | "partial" | "paid";

export interface DebtPayment {
  id: number;
  amount: number;
  date: string;
  note: string;
}

export interface Debt {
  id: number;
  name: string;
  initials: string;
  amount: number;
  remaining: number;
  dueDate: string;
  reason: string;
  status: DebtStatus;
  addedDate: string;
  payments: DebtPayment[];
  reminder: boolean;
}

export type NewDebt = Omit<Debt, "id" | "payments">;

export type ActivityType = "payment" | "add" | "overdue" | "paid";

export interface Activity {
  id: number;
  text: string;
  sub: string;
  time: string;
  type: ActivityType;
}
