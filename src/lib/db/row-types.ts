export interface PeopleRow {
  id: string;
  name: string;
  phone_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtsRow {
  id: string;
  person_id: string;
  original_amount: number;
  currency: string;
  reason: string | null;
  due_date: string;
  lent_date: string | null;
  reminder_enabled: number;
  reminder_time: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentsRow {
  id: string;
  debt_id: string;
  amount: number;
  paid_at: string;
  note: string | null;
  created_at: string;
}

export interface ActivityEventsRow {
  id: string;
  type: string;
  debt_id: string;
  payment_id: string | null;
  person_id: string;
  amount: number | null;
  occurred_at: string;
  created_at: string;
}

export interface SchemaMigrationsRow {
  version: number;
}

export interface RemindersRow {
  id: string;
  debt_id: string;
  type: string;
  remind_at: string;
  status: string;
  notification_id: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}
