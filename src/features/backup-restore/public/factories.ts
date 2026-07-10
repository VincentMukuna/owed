import Constants from "expo-constants";

import { queryClient } from "@/lib/api/query-client";
import { getDb } from "@/lib/db/client";
import { createId } from "@/lib/id";

import { DefaultBackupClient } from "../application/default-backup-client";
import { DefaultBackupFileClient } from "../application/default-backup-file-client";
import { JsonBackupCodec } from "../infrastructure/codecs/json-backup-codec";
import { ExpoBackupFileStore } from "../infrastructure/expo/expo-backup-file-store";
import { QueryCacheRestoreHook } from "../infrastructure/hooks/query-cache-restore-hook";
import { ReminderRestoreHook } from "../infrastructure/hooks/reminder-restore-hook";
import { Sha256BackupIntegrity } from "../infrastructure/integrity/sha256-backup-integrity";
import { SQLiteBackupAdapter } from "../infrastructure/sqlite/sqlite-backup-adapter";
import { ZodBackupValidator } from "../infrastructure/validation/backup-validator";
import type { BackupClient, BackupFileClient } from "./types";

function getAppId(): string {
  return (
    Constants.expoConfig?.ios?.bundleIdentifier ??
    Constants.expoConfig?.android?.package ??
    Constants.expoConfig?.slug ??
    "owed"
  );
}

export function createBackupClient(): BackupClient {
  const adapter = new SQLiteBackupAdapter(getDb);

  return new DefaultBackupClient({
    app: {
      appId: getAppId(),
      getAppVersion: () => Constants.expoConfig?.version ?? "unknown",
      getBuildVersion: () => Constants.expoConfig?.ios?.buildNumber ?? null,
    },
    source: adapter,
    destination: adapter,
    codec: new JsonBackupCodec(),
    validator: new ZodBackupValidator(),
    integrity: new Sha256BackupIntegrity(),
    hooks: [new ReminderRestoreHook(), new QueryCacheRestoreHook(queryClient)],
    clock: {
      now: () => new Date(),
    },
    idGenerator: {
      generate: createId,
    },
  });
}

export function createBackupFileClient(backup = createBackupClient()): BackupFileClient {
  return new DefaultBackupFileClient({
    backup,
    files: new ExpoBackupFileStore(),
  });
}
