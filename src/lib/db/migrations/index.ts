import type { SQLiteDatabase } from "expo-sqlite";

import { migration as migration001 } from "./001-initial";
import { migration as migration002 } from "./002-reminders";
import { migration as migration003 } from "./003-reminder-dedup";
import { migration as migration004 } from "./004-reminder-grouping";

const migrations = [migration001, migration002, migration003, migration004];

async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  const table = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
  );

  if (!table) {
    return 0;
  }

  const row = await db.getFirstAsync<{ version: number | null }>(
    "SELECT MAX(version) AS version FROM schema_migrations",
  );

  return row?.version ?? 0;
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getCurrentVersion(db);
  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.runAsync("INSERT INTO schema_migrations (version) VALUES (?)", migration.version);
    });
  }
}
