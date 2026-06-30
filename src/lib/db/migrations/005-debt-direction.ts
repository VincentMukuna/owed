export const migration = {
  version: 5,
  sql: `
ALTER TABLE debts
ADD COLUMN direction TEXT NOT NULL DEFAULT 'they_owe_me'
  CHECK (direction IN ('they_owe_me', 'i_owe_them'));

CREATE INDEX idx_debts_direction ON debts(direction);
`,
} as const;
