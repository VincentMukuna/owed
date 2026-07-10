import type { BackupDatabase } from "./backup-envelope";

type BackupDatabaseKey = keyof BackupDatabase;

type BackupTableDefinition = {
  backupKey: BackupDatabaseKey;
  tableName: string;
  orderBy: string;
};

export const BACKUP_TABLES = [
  {
    backupKey: "people",
    tableName: "people",
    orderBy: "created_at ASC, id ASC",
  },
  {
    backupKey: "debts",
    tableName: "debts",
    orderBy: "created_at ASC, id ASC",
  },
  {
    backupKey: "payments",
    tableName: "payments",
    orderBy: "created_at ASC, id ASC",
  },
  {
    backupKey: "activityEvents",
    tableName: "activity_events",
    orderBy: "occurred_at ASC, id ASC",
  },
  {
    backupKey: "reminders",
    tableName: "reminders",
    orderBy: "created_at ASC, id ASC",
  },
  {
    backupKey: "schemaMigrations",
    tableName: "schema_migrations",
    orderBy: "version ASC",
  },
] as const satisfies readonly BackupTableDefinition[];
