import { APP_CONFIG } from "@/constants/config";
import { getDb } from "@/lib/db/client";
import { type DebtWithRelations, toDebtWithRelations } from "@/lib/db/mappers";
import type { DebtsRow, PaymentsRow, PeopleRow } from "@/lib/db/row-types";
import { createId } from "@/lib/id";

import type { CreateDebtInput, RecordPaymentInput } from "../view-models";
import { activityRepository } from "./activity-repository";
import { personRepository } from "./person-repository";

type DebtPersonRow = DebtsRow & {
  person_name: string;
  person_phone_number: string | null;
  person_notes: string | null;
  person_created_at: string;
  person_updated_at: string;
};

function toPersonRow(debtRow: DebtPersonRow): PeopleRow {
  return {
    id: debtRow.person_id,
    name: debtRow.person_name,
    phone_number: debtRow.person_phone_number,
    notes: debtRow.person_notes,
    created_at: debtRow.person_created_at,
    updated_at: debtRow.person_updated_at,
  };
}

function toDebtRow(debtRow: DebtPersonRow): DebtsRow {
  return {
    id: debtRow.id,
    person_id: debtRow.person_id,
    original_amount: debtRow.original_amount,
    currency: debtRow.currency,
    reason: debtRow.reason,
    due_date: debtRow.due_date,
    lent_date: debtRow.lent_date,
    reminder_enabled: debtRow.reminder_enabled,
    reminder_time: debtRow.reminder_time,
    archived_at: debtRow.archived_at,
    created_at: debtRow.created_at,
    updated_at: debtRow.updated_at,
  };
}

const DEBT_SELECT = `
  SELECT
    d.*,
    p.name AS person_name,
    p.phone_number AS person_phone_number,
    p.notes AS person_notes,
    p.created_at AS person_created_at,
    p.updated_at AS person_updated_at
  FROM debts d
  INNER JOIN people p ON p.id = d.person_id
`;

async function fetchPaymentsByDebtIds(debtIds: string[]): Promise<Map<string, PaymentsRow[]>> {
  const paymentsByDebtId = new Map<string, PaymentsRow[]>();

  if (debtIds.length === 0) {
    return paymentsByDebtId;
  }

  const db = await getDb();
  const placeholders = debtIds.map(() => "?").join(", ");
  const payments = await db.getAllAsync<PaymentsRow>(
    `SELECT * FROM payments WHERE debt_id IN (${placeholders}) ORDER BY paid_at ASC`,
    debtIds,
  );

  for (const payment of payments) {
    const existing = paymentsByDebtId.get(payment.debt_id) ?? [];
    existing.push(payment);
    paymentsByDebtId.set(payment.debt_id, existing);
  }

  return paymentsByDebtId;
}

async function hydrateDebtRow(row: DebtPersonRow): Promise<DebtWithRelations> {
  const paymentsByDebtId = await fetchPaymentsByDebtIds([row.id]);
  const payments = paymentsByDebtId.get(row.id) ?? [];

  return toDebtWithRelations(toDebtRow(row), toPersonRow(row), payments);
}

export const debtRepository = {
  async list(): Promise<DebtWithRelations[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<DebtPersonRow>(
      `${DEBT_SELECT}
       WHERE d.archived_at IS NULL
       ORDER BY d.due_date ASC`,
    );

    const paymentsByDebtId = await fetchPaymentsByDebtIds(rows.map((row) => row.id));

    return rows.map((row) =>
      toDebtWithRelations(toDebtRow(row), toPersonRow(row), paymentsByDebtId.get(row.id) ?? []),
    );
  },

  async getById(id: string): Promise<DebtWithRelations | undefined> {
    const db = await getDb();
    const row = await db.getFirstAsync<DebtPersonRow>(`${DEBT_SELECT} WHERE d.id = ?`, [id]);

    if (!row) {
      return undefined;
    }

    return hydrateDebtRow(row);
  },

  async create(input: CreateDebtInput): Promise<DebtWithRelations> {
    const person = await personRepository.findOrCreateByName(input.personName);
    const db = await getDb();
    const now = new Date().toISOString();
    const id = createId();
    const currency = input.currency ?? APP_CONFIG.defaultCurrency;
    const reminderTime = input.reminderEnabled
      ? (input.reminderTime ?? APP_CONFIG.defaultReminderTime)
      : null;

    const debtRow: DebtsRow = {
      id,
      person_id: person.id,
      original_amount: input.originalAmount,
      currency,
      reason: input.reason?.trim() || null,
      due_date: input.dueDate,
      lent_date: null,
      reminder_enabled: input.reminderEnabled ? 1 : 0,
      reminder_time: reminderTime,
      archived_at: null,
      created_at: now,
      updated_at: now,
    };

    const personRow: PeopleRow = {
      id: person.id,
      name: person.name,
      phone_number: person.phoneNumber ?? null,
      notes: person.notes ?? null,
      created_at: person.createdAt,
      updated_at: person.updatedAt,
    };

    await db.runAsync(
      `INSERT INTO debts (
        id,
        person_id,
        original_amount,
        currency,
        reason,
        due_date,
        lent_date,
        reminder_enabled,
        reminder_time,
        archived_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?)`,
      debtRow.id,
      debtRow.person_id,
      debtRow.original_amount,
      debtRow.currency,
      debtRow.reason,
      debtRow.due_date,
      debtRow.reminder_enabled,
      debtRow.reminder_time,
      debtRow.created_at,
      debtRow.updated_at,
    );

    await activityRepository.create({
      type: "debt_created",
      debtId: id,
      personId: person.id,
      amount: input.originalAmount,
      occurredAt: now,
    });

    return toDebtWithRelations(debtRow, personRow, []);
  },

  async recordPayment(debtId: string, input: RecordPaymentInput): Promise<DebtWithRelations> {
    const db = await getDb();
    const now = new Date().toISOString();
    const paymentId = createId();
    const paidAt = input.paidAt ?? now;

    await db.runAsync(
      `INSERT INTO payments (id, debt_id, amount, paid_at, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paymentId, debtId, input.amount, paidAt, input.note?.trim() || null, now],
    );

    const updated = await this.getById(debtId);

    if (!updated) {
      throw new Error("Debt not found after recording payment");
    }

    const eventType = updated.remainingAmount <= 0 ? "debt_paid" : "payment_recorded";

    await activityRepository.create({
      type: eventType,
      debtId,
      personId: updated.person.id,
      paymentId,
      amount: input.amount,
      occurredAt: paidAt,
    });

    return updated;
  },
};
