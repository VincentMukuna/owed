import { APP_CONFIG } from "@/constants/config";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { getDb } from "@/lib/db/client";
import {
  type DebtSummary,
  type DebtWithRelations,
  toDebtSummary,
  toDebtWithRelations,
} from "@/lib/db/mappers";
import type { DebtsRow, PaymentsRow, PeopleRow } from "@/lib/db/row-types";
import { createId } from "@/lib/id";
import type { Person } from "@/types";

import type { CreateDebtInput, PersonRef, RecordPaymentInput } from "../view-models";
import { activityRepository } from "./activity-repository";
import { personRepository } from "./person-repository";

async function resolvePerson(ref: PersonRef): Promise<Person> {
  if (ref.kind === "existing") {
    const person = await personRepository.getById(ref.id);
    if (!person) {
      throw new Error(`Person not found: ${ref.id}`);
    }
    return person;
  }

  return personRepository.create(ref.name);
}

type DebtPersonRow = DebtsRow & {
  person_name: string;
  person_phone_number: string | null;
  person_notes: string | null;
  person_created_at: string;
  person_updated_at: string;
};

type DebtSummaryRow = DebtPersonRow & {
  paid_total: number;
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

const DEBT_SUMMARY_SELECT = `
  SELECT
    d.*,
    p.name AS person_name,
    p.phone_number AS person_phone_number,
    p.notes AS person_notes,
    p.created_at AS person_created_at,
    p.updated_at AS person_updated_at,
    COALESCE(pay_totals.paid_total, 0) AS paid_total
  FROM debts d
  INNER JOIN people p ON p.id = d.person_id
  LEFT JOIN (
    SELECT debt_id, SUM(amount) AS paid_total
    FROM payments
    GROUP BY debt_id
  ) pay_totals ON pay_totals.debt_id = d.id
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
  async hasAnyDebts(): Promise<boolean> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ has_debt: number }>(
      "SELECT EXISTS(SELECT 1 FROM debts LIMIT 1) AS has_debt",
    );

    return Boolean(row?.has_debt);
  },

  async getTotalRemaining(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ total: number | null }>(
      `SELECT COALESCE(SUM(d.original_amount - COALESCE(pay_totals.paid_total, 0)), 0) AS total
       FROM debts d
       LEFT JOIN (
         SELECT debt_id, SUM(amount) AS paid_total
         FROM payments
         GROUP BY debt_id
       ) pay_totals ON pay_totals.debt_id = d.id
       WHERE d.archived_at IS NULL
         AND (d.original_amount - COALESCE(pay_totals.paid_total, 0)) > 0`,
    );

    return row?.total ?? 0;
  },

  async listSummaries(): Promise<DebtSummary[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<DebtSummaryRow>(
      `${DEBT_SUMMARY_SELECT}
       WHERE d.archived_at IS NULL
       ORDER BY d.due_date ASC`,
    );

    return rows.map((row) => toDebtSummary(toDebtRow(row), toPersonRow(row), row.paid_total));
  },

  async list(): Promise<DebtSummary[]> {
    return this.listSummaries();
  },

  /** Non-archived debts for a single person, soonest due first. SQL-aggregated. */
  async listSummariesForPerson(personId: string): Promise<DebtSummary[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<DebtSummaryRow>(
      `${DEBT_SUMMARY_SELECT}
       WHERE d.archived_at IS NULL AND d.person_id = ?
       ORDER BY d.due_date ASC`,
      [personId],
    );

    return rows.map((row) => toDebtSummary(toDebtRow(row), toPersonRow(row), row.paid_total));
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
    const person = await resolvePerson(input.person);
    const db = await getDb();
    const now = new Date().toISOString();
    const id = createId();
    const currency =
      input.currency ?? useSettingsStore.getState().defaultCurrency ?? APP_CONFIG.defaultCurrency;
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
