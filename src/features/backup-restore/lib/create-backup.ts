import Constants from "expo-constants";
import type { SQLiteDatabase } from "expo-sqlite";

import { isOnboardingComplete } from "@/features/onboarding/lib/onboarding-storage";
import { loadPersistedSettings } from "@/features/reminders/lib/reminder-storage";
import { getDb } from "@/lib/db/client";

import {
  type BackupDatabase,
  type BackupEnvelope,
  type BackupPreferences,
  type BackupRow,
  CURRENT_BACKUP_SCHEMA_VERSION,
  OWED_BACKUP_APP_ID,
} from "./backup-envelope";
import { BACKUP_TABLES } from "./backup-inventory";

type CreateBackupOptions = {
  now?: Date;
  appVersion?: string;
};

async function getDatabaseSchemaVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ version: number | null }>(
    "SELECT MAX(version) AS version FROM schema_migrations",
  );

  return row?.version ?? 0;
}

async function exportDatabase(db: SQLiteDatabase): Promise<BackupDatabase> {
  const database: BackupDatabase = {
    people: [],
    debts: [],
    payments: [],
    activityEvents: [],
    reminders: [],
    schemaMigrations: [],
  };

  for (const table of BACKUP_TABLES) {
    database[table.backupKey] = await db.getAllAsync<BackupRow>(
      `SELECT * FROM ${table.tableName} ORDER BY ${table.orderBy}`,
    );
  }

  return database;
}

async function exportPreferences(): Promise<BackupPreferences> {
  const [settings, onboardingComplete] = await Promise.all([
    loadPersistedSettings(),
    isOnboardingComplete(),
  ]);

  return {
    settings: settings ?? {},
    onboardingComplete,
  };
}

function resolveAppVersion(appVersion?: string): string {
  return appVersion ?? Constants.expoConfig?.version ?? "unknown";
}

export async function createBackupEnvelope(
  options: CreateBackupOptions = {},
): Promise<BackupEnvelope> {
  const db = await getDb();
  const [databaseSchemaVersion, database, preferences] = await Promise.all([
    getDatabaseSchemaVersion(db),
    exportDatabase(db),
    exportPreferences(),
  ]);
  const now = options.now ?? new Date();

  return {
    metadata: {
      appId: OWED_BACKUP_APP_ID,
      backupSchemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      createdAt: now.toISOString(),
      appVersion: resolveAppVersion(options.appVersion),
      databaseSchemaVersion,
    },
    data: {
      database,
      preferences,
    },
  };
}
