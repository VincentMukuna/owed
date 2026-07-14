import type { DebtExportRow } from "@/features/data-export/domain/debt-export-row";
import { getDb } from "@/lib/db/client";
import { rowToDebtDirection } from "@/lib/db/mappers";

type DebtExportDatabaseRow = {
  debt_id: string;
  person_id: string;
  person_name: string;
  phone_number: string | null;
  direction: string;
  reason: string | null;
  currency: string;
  original_amount: number;
  amount_paid: number;
  remaining_amount: number;
  payment_count: number;
  last_payment_at: string | null;
  lent_date: string | null;
  due_date: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

function toDebtExportRow(row: DebtExportDatabaseRow): DebtExportRow {
  return {
    debtId: row.debt_id,
    personId: row.person_id,
    personName: row.person_name,
    phoneNumber: row.phone_number,
    direction: rowToDebtDirection(row.direction),
    reason: row.reason,
    currency: row.currency,
    originalAmount: row.original_amount,
    amountPaid: row.amount_paid,
    remainingAmount: row.remaining_amount,
    paymentCount: row.payment_count,
    lastPaymentAt: row.last_payment_at,
    lentDate: row.lent_date,
    dueDate: row.due_date,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const debtExportRepository = {
  async listRows(): Promise<DebtExportRow[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<DebtExportDatabaseRow>(`
      SELECT
        d.id AS debt_id,
        d.person_id,
        p.name AS person_name,
        p.phone_number,
        d.direction,
        d.reason,
        d.currency,
        d.original_amount,
        COALESCE(pay_totals.amount_paid, 0) AS amount_paid,
        d.original_amount - COALESCE(pay_totals.amount_paid, 0) AS remaining_amount,
        COALESCE(pay_totals.payment_count, 0) AS payment_count,
        pay_totals.last_payment_at,
        d.lent_date,
        d.due_date,
        d.archived_at,
        d.created_at,
        d.updated_at
      FROM debts d
      INNER JOIN people p ON p.id = d.person_id
      LEFT JOIN (
        SELECT
          debt_id,
          SUM(amount) AS amount_paid,
          COUNT(*) AS payment_count,
          MAX(paid_at) AS last_payment_at
        FROM payments
        GROUP BY debt_id
      ) pay_totals ON pay_totals.debt_id = d.id
      ORDER BY d.created_at ASC, d.id ASC
    `);

    return rows.map(toDebtExportRow);
  },
};
