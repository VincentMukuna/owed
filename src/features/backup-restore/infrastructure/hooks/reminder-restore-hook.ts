import {
  cancelReminderNotifications,
  listScheduledOsNotificationIds,
} from "@/features/reminders/lib/notification-service";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";

import type {
  BackupRestoreHook,
  BackupRestoreHookContext,
} from "../../ports/backup-restore-destination";

export class ReminderRestoreHook implements BackupRestoreHook {
  readonly name = "reschedule-reminders";

  async afterRestore(_context: BackupRestoreHookContext): Promise<void> {
    const scheduledIds = await listScheduledOsNotificationIds();
    await cancelReminderNotifications(scheduledIds);
    await runReminderSync();
  }
}
