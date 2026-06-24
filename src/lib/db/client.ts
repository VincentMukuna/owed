import { type SQLiteDatabase, openDatabaseAsync } from "expo-sqlite";

import { runMigrations } from "./migrations";

const DB_NAME = "owed.db";

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function initDb(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DB_NAME);
  await db.execAsync("PRAGMA foreign_keys = ON");
  await runMigrations(db);
  return db;
}

export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = initDb();
  }

  return dbPromise;
}
