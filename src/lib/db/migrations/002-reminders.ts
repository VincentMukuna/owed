export const migration = {
  version: 2,
  sql: `
CREATE TABLE reminders (
  id TEXT PRIMARY KEY NOT NULL,
  debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('due', 'overdue')),
  remind_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  notification_id TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_reminders_debt_type_active
  ON reminders(debt_id, type)
  WHERE status = 'scheduled';

CREATE INDEX idx_reminders_status_remind_at ON reminders(status, remind_at DESC);
CREATE INDEX idx_reminders_unread ON reminders(status, read_at) WHERE status = 'sent';
`,
} as const;
