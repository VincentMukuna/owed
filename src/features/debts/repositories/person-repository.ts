import { getDb } from "@/lib/db/client";
import { type PersonSummary, rowToPerson } from "@/lib/db/mappers";
import type { PeopleRow } from "@/lib/db/row-types";
import { createId } from "@/lib/id";
import type { Person } from "@/types";

type PersonSummaryRow = {
  id: string;
  name: string;
  outstanding: number;
  open_debt_count: number;
  last_activity_at: string;
};

const PERSON_SUMMARY_SELECT = `
  SELECT
    p.id AS id,
    p.name AS name,
    COALESCE(SUM(d.original_amount - COALESCE(pay.paid_total, 0)), 0) AS outstanding,
    COALESCE(
      SUM(CASE WHEN (d.original_amount - COALESCE(pay.paid_total, 0)) > 0 THEN 1 ELSE 0 END),
      0
    ) AS open_debt_count,
    COALESCE(MAX(d.created_at), p.created_at) AS last_activity_at
  FROM people p
  LEFT JOIN debts d ON d.person_id = p.id AND d.archived_at IS NULL
  LEFT JOIN (
    SELECT debt_id, SUM(amount) AS paid_total
    FROM payments
    GROUP BY debt_id
  ) pay ON pay.debt_id = d.id
  GROUP BY p.id
  ORDER BY last_activity_at DESC, p.name COLLATE NOCASE ASC
`;

export const personRepository = {
  /**
   * Lists every person with aggregated recognition cues for the picker
   * (outstanding balance + open debt count), most recently active first.
   * Aggregation happens in SQL — never load payment rows into JS for this.
   */
  async listSummaries(): Promise<PersonSummary[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<PersonSummaryRow>(PERSON_SUMMARY_SELECT);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      outstanding: row.outstanding,
      openDebtCount: row.open_debt_count,
      lastActivityAt: row.last_activity_at,
    }));
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
   */
  async create(name: string): Promise<Person> {
    const trimmed = name.trim();
    const db = await getDb();
    const now = new Date().toISOString();
    const id = createId();

    await db.runAsync(
      `INSERT INTO people (id, name, phone_number, notes, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, ?, ?)`,
      [id, trimmed, now, now],
    );

    return rowToPerson({
      id,
      name: trimmed,
      phone_number: null,
      notes: null,
      created_at: now,
      updated_at: now,
    });
  },
};
