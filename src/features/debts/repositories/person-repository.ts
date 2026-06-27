import { statusDateParams } from "@/features/debts/lib/status-engine";
import type { ActivityEventWithRelations } from "@/features/debts/repositories/activity-repository";
import { getDb } from "@/lib/db/client";
import { type DebtSummary, type PersonSummary, rowToPerson } from "@/lib/db/mappers";
import type { PeopleRow } from "@/lib/db/row-types";
import { createId } from "@/lib/id";
import type { Person } from "@/types";

import { activityRepository } from "./activity-repository";
import { debtRepository } from "./debt-repository";

export type PersonDetailData = {
  person: Person;
  summary: PersonSummary;
  debts: DebtSummary[];
  events: ActivityEventWithRelations[];
};

type PersonSummaryRow = {
  id: string;
  name: string;
  phone_number: string | null;
  outstanding: number;
  original_total: number;
  open_debt_count: number;
  overdue_count: number;
  due_soon_count: number;
  paid_debt_count: number;
  total_debt_count: number;
  last_activity_at: string;
};

// Remaining balance for a single joined debt row.
const REMAINING = "(d.original_amount - COALESCE(pay.paid_total, 0))";

// Per-person aggregation. The `?` placeholders are, in order: today (overdue
// cutoff), today (due-soon lower bound), dueSoon (due-soon upper bound). All
// aggregation stays in SQL — never load payment rows into JS for these.
function personSummarySelect(scoped: boolean): string {
  return `
    SELECT
      p.id AS id,
      p.name AS name,
      p.phone_number AS phone_number,
      COALESCE(SUM(${REMAINING}), 0) AS outstanding,
      COALESCE(SUM(d.original_amount), 0) AS original_total,
      COALESCE(SUM(CASE WHEN ${REMAINING} > 0 THEN 1 ELSE 0 END), 0) AS open_debt_count,
      COALESCE(SUM(CASE WHEN ${REMAINING} > 0 AND d.due_date < ? THEN 1 ELSE 0 END), 0) AS overdue_count,
      COALESCE(
        SUM(CASE WHEN ${REMAINING} > 0 AND d.due_date >= ? AND d.due_date <= ? THEN 1 ELSE 0 END),
        0
      ) AS due_soon_count,
      COALESCE(SUM(CASE WHEN d.id IS NOT NULL AND ${REMAINING} <= 0 THEN 1 ELSE 0 END), 0) AS paid_debt_count,
      COALESCE(SUM(CASE WHEN d.id IS NOT NULL THEN 1 ELSE 0 END), 0) AS total_debt_count,
      COALESCE(
        MAX(MAX(d.created_at, COALESCE(pay.last_paid_at, d.created_at))),
        p.created_at
      ) AS last_activity_at
    FROM people p
    LEFT JOIN debts d ON d.person_id = p.id AND d.archived_at IS NULL
    LEFT JOIN (
      SELECT debt_id, SUM(amount) AS paid_total, MAX(created_at) AS last_paid_at
      FROM payments
      GROUP BY debt_id
    ) pay ON pay.debt_id = d.id
    ${scoped ? "WHERE p.id = ?" : ""}
    GROUP BY p.id
    ORDER BY last_activity_at DESC, p.name COLLATE NOCASE ASC
  `;
}

function rowToPersonSummary(row: PersonSummaryRow): PersonSummary {
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phone_number ?? undefined,
    outstanding: row.outstanding,
    originalTotal: row.original_total,
    openDebtCount: row.open_debt_count,
    overdueCount: row.overdue_count,
    dueSoonCount: row.due_soon_count,
    paidDebtCount: row.paid_debt_count,
    totalDebtCount: row.total_debt_count,
    lastActivityAt: row.last_activity_at,
  };
}

export const personRepository = {
  /**
   * Lists every person with aggregated recognition cues (outstanding balance,
   * open/overdue/due-soon/paid counts, last activity), most recently active
   * first. Aggregation happens in SQL — never load payment rows into JS here.
   */
  async listSummaries(): Promise<PersonSummary[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<PersonSummaryRow>(
      personSummarySelect(false),
      statusDateParams(),
    );

    return rows.map(rowToPersonSummary);
  },

  async getDetailData(personId: string): Promise<PersonDetailData | undefined> {
    const [person, summary, debts, events] = await Promise.all([
      this.getById(personId),
      this.getSummary(personId),
      debtRepository.listSummariesForPerson(personId),
      activityRepository.listForPerson(personId),
    ]);

    if (!person || !summary) {
      return undefined;
    }

    return { person, summary, debts, events };
  },

  /** Single person's aggregates, computed with the same SQL as the list. */
  async getSummary(id: string): Promise<PersonSummary | undefined> {
    const db = await getDb();
    const row = await db.getFirstAsync<PersonSummaryRow>(personSummarySelect(true), [
      ...statusDateParams(),
      id,
    ]);

    return row ? rowToPersonSummary(row) : undefined;
  },

  async getById(id: string): Promise<Person | undefined> {
    const db = await getDb();
    const row = await db.getFirstAsync<PeopleRow>("SELECT * FROM people WHERE id = ?", [id]);

    return row ? rowToPerson(row) : undefined;
  },

  /**
   * Unconditionally inserts a new person. De-duplication is the picker's
   * responsibility (it surfaces existing matches); this never reuses a row, so
   * the user's explicit choice to create a same-named person is always honored.
   * `details` lets the manual "Add person" flow capture phone/notes up front;
   * the add-debt path omits them (name only).
   */
  async create(
    name: string,
    details?: { phoneNumber?: string | null; notes?: string | null },
  ): Promise<Person> {
    const trimmed = name.trim();
    const phone = details?.phoneNumber?.trim() || null;
    const notes = details?.notes?.trim() || null;
    const db = await getDb();
    const now = new Date().toISOString();
    const id = createId();

    await db.runAsync(
      `INSERT INTO people (id, name, phone_number, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, trimmed, phone, notes, now, now],
    );

    return rowToPerson({
      id,
      name: trimmed,
      phone_number: phone,
      notes,
      created_at: now,
      updated_at: now,
    });
  },

  /**
   * Updates a person's editable details. Because debts reference the person by
   * id, a rename here flows to every linked debt and activity entry on refetch.
   */
  async update(
    id: string,
    fields: { name: string; phoneNumber?: string | null; notes?: string | null },
  ): Promise<Person> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE people SET name = ?, phone_number = ?, notes = ?, updated_at = ? WHERE id = ?`,
      [
        fields.name.trim(),
        fields.phoneNumber?.trim() || null,
        fields.notes?.trim() || null,
        now,
        id,
      ],
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Person not found: ${id}`);
    }

    return updated;
  },
};
