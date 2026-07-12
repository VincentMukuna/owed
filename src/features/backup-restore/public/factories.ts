import Constants from "expo-constants";

import {
  cancelReminderNotifications,
  listScheduledOsNotificationIds,
} from "@/features/reminders/lib/notification-service";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { queryClient } from "@/lib/api/query-client";
import { getDb } from "@/lib/db/client";
import { createId } from "@/lib/id";

import { DefaultBackupClient } from "../client/default-backup-client";
import type { BackupStore } from "../files/backup-store";
import { ExpoBackupStore } from "../files/expo-backup-store";
import { jsonBackupCodec } from "../files/json-backup-codec";
import { sha256Integrity } from "../files/sha256-integrity";
import { SQLiteBackupAdapter } from "../persistence/sqlite-backup-adapter";
import type { BackupClient } from "./types";

function getAppId(): string {
  return (
    Constants.expoConfig?.ios?.bundleIdentifier ??
    Constants.expoConfig?.android?.package ??
    Constants.expoConfig?.slug ??
    "owed"
  );
}

export function createBackupClient(): BackupClient {
  const snapshot = new SQLiteBackupAdapter(getDb);

  return new DefaultBackupClient({
    app: {
      appId: getAppId(),
      getAppVersion: () => Constants.expoConfig?.version ?? "unknown",
      getBuildVersion: () => Constants.expoConfig?.ios?.buildNumber ?? null,
    },
    snapshot,
    codec: jsonBackupCodec,
    integrity: sha256Integrity,
    afterRestore: [
      {
        name: "reschedule-reminders",
        run: async () => {
          const scheduledIds = await listScheduledOsNotificationIds();
          await cancelReminderNotifications(scheduledIds);
          await runReminderSync();
        },
      },
      {
        name: "invalidate-caches",
        run: async () => {
          await queryClient.invalidateQueries();
        },
      },
    ],
    clock: {
      now: () => new Date(),
    },
    idGenerator: {
      generate: createId,
    },
  });
}

export function createBackupStore(): BackupStore {
  return new ExpoBackupStore();
}
