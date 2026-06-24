export const migration = {
  version: 1,
  sql: `
CREATE TABLE people (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE debts (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  original_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  reason TEXT,
  due_date TEXT NOT NULL,
  lent_date TEXT,
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY NOT NULL,
  debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  paid_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE activity_events (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES payments(id) ON DELETE SET NULL,
  person_id TEXT NOT NULL REFERENCES people(id),
  amount INTEGER,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL
);

CREATE INDEX idx_debts_person_id ON debts(person_id);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_payments_debt_id ON payments(debt_id);
CREATE INDEX idx_activity_events_occurred_at ON activity_events(occurred_at DESC);
`,
} as const;
