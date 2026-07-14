import { debtRepository } from "@/features/debts/repositories/debt-repository";
import { reminderKeys } from "@/features/reminders/hooks/query-keys";
import { canScheduleOsNotifications } from "@/features/reminders/lib/notification-permissions";
import {
  cancelReminderNotifications,
  scheduleReminderNotification,
} from "@/features/reminders/lib/notification-service";
import {
  buildCollapsedReminderContent,
  buildReminderNotificationContent,
  computeDueRemindAt,
  computeOverdueRemindAt,
  groupKeyFor,
  isReminderInPast,
  toReminderISO,
} from "@/features/reminders/lib/reminder-scheduler";
import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { queryClient } from "@/lib/api/query-client";
import type { DebtSummary } from "@/lib/db/mappers";
import type { Reminder, ReminderType } from "@/types";

/** Max pending OS notifications to register at once (iOS hard-caps an app at 64). */
const NOTIFICATION_WINDOW_SIZE = 50;
/** A bucket with at least this many debts collapses into a single OS notification. */
const COLLAPSE_THRESHOLD = 6;
/** Sent/cancelled reminders older than this are soft-archived (never deleted). */
const ARCHIVE_AFTER_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isDebtReminderEligible(debt: DebtSummary): boolean {
  return debt.reminderEnabled && !debt.archivedAt && debt.remainingAmount > 0;
}

function reminderKey(debtId: string, type: ReminderType, remindAt: string): string {
  return `${debtId}|${type}|${remindAt}`;
}

function collectOsId(ids: string[], notificationId: string | undefined): void {
  if (notificationId) {
    ids.push(notificationId);
  }
}

type ReminderBucket = {
  type: ReminderType;
  dueDate: string;
  remindAt: string;
  members: Reminder[];
};

type SchedulePlanItem =
  | {
      kind: "group";
      remindAt: string;
      reminderIds: string[];
      title: string;
      body: string;
      type: ReminderType;
      dueDate: string;
    }
  | {
      kind: "single";
      remindAt: string;
      reminderIds: string[];
      title: string;
      body: string;
      debtId: string;
      reminderId: string;
      type: ReminderType;
    };

function parseGroupKey(groupKey: string): { type: ReminderType; dueDate: string } {
  const separator = groupKey.indexOf(":");
  return {
    type: groupKey.slice(0, separator) as ReminderType,
    dueDate: groupKey.slice(separator + 1),
  };
}

function buildSchedulePlan(
  scheduled: Reminder[],
  eligibleById: Map<string, DebtSummary>,
): SchedulePlanItem[] {
  const buckets = new Map<string, ReminderBucket>();
  for (const reminder of scheduled) {
    if (!reminder.groupKey) {
      continue;
    }
    let bucket = buckets.get(reminder.groupKey);
    if (!bucket) {
      const { type, dueDate } = parseGroupKey(reminder.groupKey);
      bucket = { type, dueDate, remindAt: reminder.remindAt, members: [] };
      buckets.set(reminder.groupKey, bucket);
    }
    bucket.members.push(reminder);
  }

  const inWindow = [...buckets.values()]
    .sort((a, b) => a.remindAt.localeCompare(b.remindAt))
    .slice(0, NOTIFICATION_WINDOW_SIZE);

  const plan: SchedulePlanItem[] = [];

  for (const bucket of inWindow) {
    const members = bucket.members
      .map((reminder) => ({ reminder, debt: eligibleById.get(reminder.debtId) }))
      .filter((entry): entry is { reminder: Reminder; debt: DebtSummary } => Boolean(entry.debt));

    if (members.length === 0) {
      continue;
    }

    if (members.length >= COLLAPSE_THRESHOLD) {
      const sorted = [...members].sort(
        (a, b) =>
          b.debt.remainingAmount - a.debt.remainingAmount ||
          a.debt.person.name.localeCompare(b.debt.person.name),
      );
      const total = sorted.reduce((sum, entry) => sum + entry.debt.remainingAmount, 0);
      const firstDirection = sorted[0].debt.direction;
      const direction = sorted.every((entry) => entry.debt.direction === firstDirection)
        ? firstDirection
        : "mixed";
      const content = buildCollapsedReminderContent({
        type: bucket.type,
        direction,
        names: sorted.map((entry) => entry.debt.person.name),
        totalCount: members.length,
        totalRemaining: total,
        currency: sorted[0].debt.currency,
      });

      plan.push({
        kind: "group",
        remindAt: bucket.remindAt,
        reminderIds: members.map((entry) => entry.reminder.id),
        title: content.title,
        body: content.body,
        type: bucket.type,
        dueDate: bucket.dueDate,
      });
      continue;
    }

    for (const { reminder, debt } of members) {
      const content = buildReminderNotificationContent({
        type: bucket.type,
        direction: debt.direction,
        personName: debt.person.name,
        remainingAmount: debt.remainingAmount,
        currency: debt.currency,
      });

      plan.push({
        kind: "single",
        remindAt: bucket.remindAt,
        reminderIds: [reminder.id],
        title: content.title,
        body: content.body,
        debtId: debt.id,
        reminderId: reminder.id,
        type: bucket.type,
      });
    }
  }

  return plan;
}

/**
 * DB-only reconciliation. Collects OS notification ids to cancel after the
 * DB phase — never awaits notification APIs mid-write.
 */
async function reconcileReminderRows(now: Date): Promise<{
  eligibleById: Map<string, DebtSummary>;
  osIdsToCancel: string[];
  scheduledForOs: Reminder[];
}> {
  const nowIso = now.toISOString();
  const osIdsToCancel: string[] = [];

  const missed = await reminderRepository.listScheduledBeforeOrAt(nowIso);
  for (const reminder of missed) {
    collectOsId(osIdsToCancel, reminder.notificationId);
    await reminderRepository.update(reminder.id, { status: "sent", notificationId: null });
  }

  const ineligible = await reminderRepository.listIneligibleScheduled();
  for (const reminder of ineligible) {
    collectOsId(osIdsToCancel, reminder.notificationId);
    await reminderRepository.update(reminder.id, { status: "cancelled", notificationId: null });
  }

  const { defaultReminderTime, overdueReminderEnabled } = useSettingsStore.getState();

  if (!overdueReminderEnabled) {
    const scheduledOverdue = await reminderRepository.listScheduledByType("overdue");
    for (const reminder of scheduledOverdue) {
      collectOsId(osIdsToCancel, reminder.notificationId);
      await reminderRepository.update(reminder.id, { status: "cancelled", notificationId: null });
    }
  }

  const summaries = await debtRepository.listSummaries();
  const eligible = summaries.filter(isDebtReminderEligible);
  const eligibleById = new Map(eligible.map((debt) => [debt.id, debt]));

  const active = await reminderRepository.listActive();
  const activeByKey = new Map(
    active.map((reminder) => [
      reminderKey(reminder.debtId, reminder.type, reminder.remindAt),
      reminder,
    ]),
  );
  const scheduledByDebtType = new Map<string, Reminder>();
  for (const reminder of active) {
    if (reminder.status === "scheduled") {
      scheduledByDebtType.set(`${reminder.debtId}|${reminder.type}`, reminder);
    }
  }

  const types: ReminderType[] = overdueReminderEnabled ? ["due", "overdue"] : ["due"];

  for (const debt of eligible) {
    for (const type of types) {
      const remindAtDate =
        type === "due"
          ? computeDueRemindAt(debt.dueDate, defaultReminderTime)
          : computeOverdueRemindAt(debt.dueDate, defaultReminderTime);
      const remindAtIso = toReminderISO(remindAtDate);
      const desiredGroupKey = groupKeyFor(type, debt.dueDate);

      const existing = activeByKey.get(reminderKey(debt.id, type, remindAtIso));
      if (existing) {
        if (existing.groupKey !== desiredGroupKey) {
          await reminderRepository.update(existing.id, { groupKey: desiredGroupKey });
        }
        continue;
      }

      const stale = scheduledByDebtType.get(`${debt.id}|${type}`);
      if (stale && stale.remindAt !== remindAtIso) {
        collectOsId(osIdsToCancel, stale.notificationId);
        await reminderRepository.update(stale.id, { status: "cancelled", notificationId: null });
      }

      await reminderRepository.create({
        debtId: debt.id,
        type,
        remindAt: remindAtIso,
        status: isReminderInPast(remindAtDate, now) ? "sent" : "scheduled",
        groupKey: desiredGroupKey,
      });
    }
  }

  const archiveBefore = new Date(now.getTime() - ARCHIVE_AFTER_DAYS * MS_PER_DAY).toISOString();
  await reminderRepository.markArchivedBefore(archiveBefore);

  const scheduledForOs = await reminderRepository.listScheduled();
  for (const reminder of scheduledForOs) {
    collectOsId(osIdsToCancel, reminder.notificationId);
  }
  await reminderRepository.clearScheduledNotificationIds();

  return { eligibleById, osIdsToCancel, scheduledForOs };
}

async function stampNotificationIds(
  stamps: { reminderIds: string[]; notificationId: string }[],
): Promise<void> {
  if (stamps.length === 0) {
    return;
  }

  for (const stamp of stamps) {
    await reminderRepository.setRemindersNotificationId(stamp.reminderIds, stamp.notificationId);
  }
}

async function syncOnce(): Promise<void> {
  const now = new Date();

  const { eligibleById, osIdsToCancel, scheduledForOs } = await reconcileReminderRows(now);

  const uniqueCancelIds = [...new Set(osIdsToCancel)];
  await cancelReminderNotifications(uniqueCancelIds);

  if (!(await canScheduleOsNotifications())) {
    await queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    return;
  }

  const plan = buildSchedulePlan(
    scheduledForOs.map((reminder) => ({ ...reminder, notificationId: undefined })),
    eligibleById,
  );

  const stamps: { reminderIds: string[]; notificationId: string }[] = [];
  for (const item of plan) {
    const notificationId = await scheduleReminderNotification({
      remindAt: item.remindAt,
      title: item.title,
      body: item.body,
      data:
        item.kind === "group"
          ? { kind: "group", type: item.type, focusDate: item.dueDate }
          : {
              kind: "single",
              debtId: item.debtId,
              reminderId: item.reminderId,
              type: item.type,
            },
    });

    if (notificationId) {
      stamps.push({ reminderIds: item.reminderIds, notificationId });
    }
  }

  await stampNotificationIds(stamps);
  await queryClient.invalidateQueries({ queryKey: reminderKeys.all });
}

let current: Promise<void> | null = null;
let rerunRequested = false;

/**
 * The single serialized entry point for all reminder reconciliation. Safe to
 * call from anywhere (app start, foreground, mutations, settings, permission
 * grants). Concurrent calls coalesce: a call made while a run is in flight
 * guarantees exactly one more full run afterwards.
 */
export function runReminderSync(): Promise<void> {
  if (current) {
    rerunRequested = true;
    return current;
  }

  current = (async () => {
    try {
      await runGuarded();
      while (rerunRequested) {
        rerunRequested = false;
        await runGuarded();
      }
    } finally {
      current = null;
    }
  })();

  return current;
}

async function runGuarded(): Promise<void> {
  try {
    await syncOnce();
  } catch (error) {
    if (__DEV__) {
      console.error("[runReminderSync] failed", error);
    }
  }
}
