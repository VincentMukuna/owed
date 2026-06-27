import { type SQLiteDatabase } from "expo-sqlite";

import { getDb } from "@/lib/db/client";
import type { ActivityEventsRow } from "@/lib/db/row-types";
import { createId } from "@/lib/id";
import type { ActivityEvent, ActivityEventType } from "@/types";

export type CreateActivityEventInput = {
  type: ActivityEventType;
  debtId: string;
  personId: string;
  paymentId?: string;
  amount?: number;
  occurredAt?: string;
};

type ActivityEventListRow = ActivityEventsRow & {
  person_name: string;
  debt_reason: string | null;
  debt_currency: string;
  payment_note: string | null;
};

function rowToActivityEvent(row: ActivityEventsRow): ActivityEvent {
  return {
    id: row.id,
    type: row.type as ActivityEventType,
    debtId: row.debt_id,
    paymentId: row.payment_id ?? undefined,
    personId: row.person_id,
    amount: row.amount ?? undefined,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

export type ActivityEventWithRelations = ActivityEvent & {
  personName: string;
  debtReason?: string;
  debtCurrency: string;
  paymentNote?: string;
};

function rowToActivityEventWithRelations(row: ActivityEventListRow): ActivityEventWithRelations {
  return {
    ...rowToActivityEvent(row),
    personName: row.person_name,
    debtReason: row.debt_reason ?? undefined,
    debtCurrency: row.debt_currency,
    paymentNote: row.payment_note ?? undefined,
  };
}

const ACTIVITY_SELECT = `
  SELECT
    ae.*,
    p.name AS person_name,
    d.reason AS debt_reason,
    d.currency AS debt_currency,
    pay.note AS payment_note
  FROM activity_events ae
  INNER JOIN people p ON p.id = ae.person_id
  INNER JOIN debts d ON d.id = ae.debt_id
  LEFT JOIN payments pay ON pay.id = ae.payment_id
`;

async function insertActivityEvent(
  db: SQLiteDatabase,
  input: CreateActivityEventInput,
): Promise<void> {
  const now = new Date().toISOString();
  const id = createId();
  const occurredAt = input.occurredAt ?? now;

  await db.runAsync(
    `INSERT INTO activity_events (
      id,
      type,
      debt_id,
      payment_id,
      person_id,
      amount,
      occurred_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.type,
    input.debtId,
    input.paymentId ?? null,
    input.personId,
    input.amount ?? null,
    occurredAt,
    now,
  );
}

export const activityRepository = {
  async create(input: CreateActivityEventInput): Promise<void> {
    const db = await getDb();
    await insertActivityEvent(db, input);
  },

  async createWithDb(db: SQLiteDatabase, input: CreateActivityEventInput): Promise<void> {
    await insertActivityEvent(db, input);
  },

  async list(): Promise<ActivityEventWithRelations[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ActivityEventListRow>(
      `${ACTIVITY_SELECT} ORDER BY ae.occurred_at DESC`,
    );

    return rows.map(rowToActivityEventWithRelations);
  },

  async listRecent(limit: number): Promise<ActivityEventWithRelations[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ActivityEventListRow>(
      `${ACTIVITY_SELECT} ORDER BY ae.occurred_at DESC LIMIT ?`,
      [limit],
    );

    return rows.map(rowToActivityEventWithRelations);
  },

  async listForPerson(personId: string): Promise<ActivityEventWithRelations[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ActivityEventListRow>(
      `${ACTIVITY_SELECT}
       WHERE ae.person_id = ?
       ORDER BY ae.occurred_at DESC`,
      [personId],
    );

    return rows.map(rowToActivityEventWithRelations);
  },
};
