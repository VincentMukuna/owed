import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  REALISTIC_SEED_DEBT_COUNT,
  REALISTIC_SEED_PAYMENT_COUNT,
  REALISTIC_SEED_PEOPLE_COUNT,
  simulateRealisticUsage,
} from "./seed-debts";

const runAsync = vi.fn();
const withTransactionAsync = vi.fn(async (callback: () => Promise<void>) => callback());

vi.mock("@/lib/db/client", () => ({
  getDb: vi.fn(async () => ({ runAsync, withTransactionAsync })),
}));

vi.mock("@/lib/id", () => {
  let nextId = 0;
  return { createId: () => `seed-id-${nextId++}` };
});

describe("simulateRealisticUsage", () => {
  beforeEach(() => {
    faker.seed(42);
    runAsync.mockClear();
    withTransactionAsync.mockClear();
  });

  it("creates a small history in the requested currency", async () => {
    const result = await simulateRealisticUsage("EUR");
    const debtInserts = runAsync.mock.calls.filter(([sql]) =>
      String(sql).includes("INSERT INTO debts"),
    );
    const originalAmounts = debtInserts.map(([, , , , amount]) => Number(amount));
    const currencies = debtInserts.map(([, , , , , currency]) => currency);

    expect(result).toEqual({
      people: REALISTIC_SEED_PEOPLE_COUNT,
      debts: REALISTIC_SEED_DEBT_COUNT,
      payments: REALISTIC_SEED_PAYMENT_COUNT,
      activities: REALISTIC_SEED_DEBT_COUNT + REALISTIC_SEED_PAYMENT_COUNT,
    });
    expect(originalAmounts).toHaveLength(REALISTIC_SEED_DEBT_COUNT);
    expect(originalAmounts.every((amount) => amount >= 5 && amount <= 150)).toBe(true);
    expect(currencies.every((currency) => currency === "EUR")).toBe(true);
    expect(withTransactionAsync).toHaveBeenCalledOnce();
  });
});
