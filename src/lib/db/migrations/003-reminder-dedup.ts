export const migration = {
  version: 3,
  sql: `
DELETE FROM reminders
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM reminders
  WHERE status IN ('scheduled', 'sent')
  GROUP BY debt_id, type, remind_at
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_debt_type_remind_at_active
  ON reminders(debt_id, type, remind_at)
  WHERE status IN ('scheduled', 'sent');
`,
} as const;
