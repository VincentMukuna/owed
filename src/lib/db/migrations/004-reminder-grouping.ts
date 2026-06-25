export const migration = {
  version: 4,
  sql: `
ALTER TABLE reminders ADD COLUMN group_key TEXT;
ALTER TABLE reminders ADD COLUMN archived_at TEXT;

CREATE INDEX IF NOT EXISTS idx_reminders_group_key ON reminders(group_key);
CREATE INDEX IF NOT EXISTS idx_reminders_archived ON reminders(status, archived_at);
`,
} as const;
