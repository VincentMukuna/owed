import { describe, expect, it } from "vitest";

import type { DebtExportRow } from "@/features/data-export/domain/debt-export-row";
import { createDebtCsv, suggestDebtCsvFileName } from "@/features/data-export/lib/debt-csv";

const NOW = new Date("2026-07-14T12:00:00.000Z");

function createRow(overrides: Partial<DebtExportRow> = {}): DebtExportRow {
  return {
    debtId: "debt-1",
    personId: "person-1",
    personName: "Amina",
    phoneNumber: "+254700000000",
    direction: "they_owe_me",
    reason: "Lunch",
    currency: "KES",
    originalAmount: 1_000,
    amountPaid: 250,
    remainingAmount: 750,
    paymentCount: 1,
    lastPaymentAt: "2026-07-10T09:30:00.000Z",
    lentDate: "2026-07-01",
    dueDate: "2026-07-20",
    archivedAt: null,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-10T09:30:00.000Z",
    ...overrides,
  };
}

describe("debt CSV export", () => {
  it("creates one flattened row with numeric balances and a derived status", () => {
    const csv = createDebtCsv([createRow()], NOW);
    const [header, row] = csv.slice(1).trimEnd().split("\r\n");

    expect(header).toBe(
      "person_name,phone_number,direction,reason,currency,original_amount,amount_paid,remaining_amount,payment_count,last_payment_at,lent_date,due_date,status,archived,archived_at,created_at,updated_at,person_id,debt_id",
    );
    expect(row).toBe(
      "Amina,'+254700000000,they_owe_me,Lunch,KES,1000,250,750,1,2026-07-10T09:30:00.000Z,2026-07-01,2026-07-20,partial,false,,2026-07-01T08:00:00.000Z,2026-07-10T09:30:00.000Z,person-1,debt-1",
    );
  });

  it("quotes CSV punctuation and neutralizes spreadsheet formulas", () => {
    const csv = createDebtCsv(
      [
        createRow({
          personName: 'Amina, "AJ"',
          reason: "=SUM(1,2)\nDo not evaluate",
        }),
      ],
      NOW,
    );

    expect(csv).toContain('"Amina, ""AJ"""');
    expect(csv).toContain('"\'=SUM(1,2)\nDo not evaluate"');
  });

  it("marks archived debts and preserves blank nullable values", () => {
    const csv = createDebtCsv(
      [
        createRow({
          phoneNumber: null,
          reason: null,
          amountPaid: 0,
          remainingAmount: 1_000,
          paymentCount: 0,
          lastPaymentAt: null,
          lentDate: null,
          archivedAt: "2026-07-12T10:00:00.000Z",
        }),
      ],
      NOW,
    );

    expect(csv).toContain(
      "Amina,,they_owe_me,,KES,1000,0,1000,0,,,2026-07-20,archived,true,2026-07-12T10:00:00.000Z",
    );
  });

  it("writes a UTF-8 BOM and a header for an empty report", () => {
    const csv = createDebtCsv([], NOW);

    expect(csv.startsWith("\uFEFFperson_name,")).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});

describe("debt CSV filename", () => {
  it("uses the UTC export date", () => {
    expect(suggestDebtCsvFileName(NOW)).toBe("owed-debts-2026-07-14.csv");
  });
});
