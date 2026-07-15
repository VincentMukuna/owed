import { describe, expect, it } from "vitest";

import type { DebtCardView } from "../view-models";
import { sortDebtsByPreference } from "./debt-list-utils";

function debt(id: string, overrides: Partial<DebtCardView> = {}): DebtCardView {
  return {
    id,
    name: id,
    initials: id.slice(0, 2).toUpperCase(),
    direction: "they_owe_me",
    amount: 100,
    remaining: 100,
    currency: "KES",
    dueDate: "",
    dueDateISO: "2026-08-01",
    reason: "",
    subtitle: "Due in 17 days",
    status: "active",
    createdAt: "2026-07-01T00:00:00.000Z",
    addedDate: "1 Jul",
    payments: [],
    reminder: false,
    ...overrides,
  };
}

const NOW = new Date("2026-07-15T12:00:00.000Z");

describe("Debt ordering", () => {
  it("prioritizes overdue partial promises using their raw due date", () => {
    const result = sortDebtsByPreference(
      [
        debt("active", { dueDateISO: "2026-08-01" }),
        debt("due-soon", { dueDateISO: "2026-07-16", status: "due-soon" }),
        debt("partial-overdue", {
          dueDateISO: "2026-07-01",
          remaining: 50,
          status: "partial",
        }),
      ],
      undefined,
      NOW,
    );

    expect(result.map(({ id }) => id)).toEqual(["partial-overdue", "due-soon", "active"]);
  });

  it("orders settled promises by most recent settlement in attention mode", () => {
    const result = sortDebtsByPreference(
      [
        debt("older", { remaining: 0, status: "paid", lastPaymentAt: "2026-07-01" }),
        debt("newer", { remaining: 0, status: "paid", lastPaymentAt: "2026-07-12" }),
      ],
      undefined,
      NOW,
    );

    expect(result.map(({ id }) => id)).toEqual(["newer", "older"]);
  });

  it("keeps settled zero balances after positive balances when sorting least first", () => {
    const result = sortDebtsByPreference(
      [
        debt("settled", { remaining: 0, status: "paid" }),
        debt("large", { remaining: 500 }),
        debt("small", { remaining: 25 }),
      ],
      { criterion: "amount", direction: "asc" },
      NOW,
    );

    expect(result.map(({ id }) => id)).toEqual(["small", "large", "settled"]);
  });
});
