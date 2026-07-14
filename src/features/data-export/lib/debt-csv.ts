import type { DebtExportRow } from "@/features/data-export/domain/debt-export-row";
import { computeDebtStatus } from "@/features/debts/lib/status-engine";

export const DEBT_CSV_MIME_TYPE = "text/csv";
export const DEBT_CSV_UTI = "public.comma-separated-values-text";

type CsvValue = string | number | boolean | null;

type DebtCsvColumn = {
  header: string;
  value: (row: DebtExportRow, now: Date) => CsvValue;
};

const DEBT_CSV_COLUMNS: DebtCsvColumn[] = [
  { header: "person_name", value: (row) => row.personName },
  { header: "phone_number", value: (row) => row.phoneNumber },
  { header: "direction", value: (row) => row.direction },
  { header: "reason", value: (row) => row.reason },
  { header: "currency", value: (row) => row.currency },
  { header: "original_amount", value: (row) => row.originalAmount },
  { header: "amount_paid", value: (row) => row.amountPaid },
  { header: "remaining_amount", value: (row) => row.remainingAmount },
  { header: "payment_count", value: (row) => row.paymentCount },
  { header: "last_payment_at", value: (row) => row.lastPaymentAt },
  { header: "lent_date", value: (row) => row.lentDate },
  { header: "due_date", value: (row) => row.dueDate },
  {
    header: "status",
    value: (row, now) =>
      computeDebtStatus({
        originalAmount: row.originalAmount,
        remainingAmount: row.remainingAmount,
        dueDate: row.dueDate,
        archivedAt: row.archivedAt,
        now,
      }),
  },
  { header: "archived", value: (row) => row.archivedAt !== null },
  { header: "archived_at", value: (row) => row.archivedAt },
  { header: "created_at", value: (row) => row.createdAt },
  { header: "updated_at", value: (row) => row.updatedAt },
  { header: "person_id", value: (row) => row.personId },
  { header: "debt_id", value: (row) => row.debtId },
];

function protectSpreadsheetFormula(value: string): string {
  if (/^[\t\r]|^\s*[=+\-@]/.test(value)) {
    return `'${value}`;
  }

  return value;
}

function escapeCsvValue(value: CsvValue): string {
  if (value === null) {
    return "";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const protectedValue = protectSpreadsheetFormula(value);

  if (/[,"\r\n]/.test(protectedValue)) {
    return `"${protectedValue.replace(/"/g, '""')}"`;
  }

  return protectedValue;
}

export function createDebtCsv(rows: DebtExportRow[], now: Date = new Date()): string {
  const header = DEBT_CSV_COLUMNS.map((column) => column.header).join(",");
  const body = rows.map((row) =>
    DEBT_CSV_COLUMNS.map((column) => escapeCsvValue(column.value(row, now))).join(","),
  );

  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}

export function suggestDebtCsvFileName(createdAt: Date = new Date()): string {
  return `owed-debts-${createdAt.toISOString().slice(0, 10)}.csv`;
}
