import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildHomeBriefing } from "@/features/debts/lib/debt-list-utils";
import { computeDebtStatus } from "@/features/debts/lib/status-engine";
import type { DebtCardView } from "@/features/debts/view-models";
import type { DebtDirection } from "@/types";

import {
  REALISTIC_SEED_DEBT_COUNT,
  REALISTIC_SEED_PAYMENT_COUNT,
  REALISTIC_SEED_PEOPLE_COUNT,
  simulateRealisticUsage,
} from "./seed-debts";

const runAsync = vi.fn();
const withTransactionAsync = vi.fn(async (callback: () => Promise<void>) => callback());
const NOW = new Date("2026-07-15T12:00:00.000Z");

vi.mock("@/lib/db/client", () => ({
  getDb: vi.fn(async () => ({ runAsync, withTransactionAsync })),
}));

vi.mock("@/lib/id", () => {
  let nextId = 0;
  return { createId: () => `seed-id-${nextId++}` };
});

describe("simulateRealisticUsage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    faker.seed(42);
    runAsync.mockClear();
    withTransactionAsync.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a small global history in USD", async () => {
    const result = await simulateRealisticUsage();
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
    expect(currencies.every((currency) => currency === "USD")).toBe(true);
    expect(withTransactionAsync).toHaveBeenCalledOnce();
  });

  it("guarantees every conditional Home section has screenshot-ready content", async () => {
    await simulateRealisticUsage();

    const people = new Map(
      runAsync.mock.calls
        .filter(([sql]) => String(sql).includes("INSERT INTO people"))
        .map(([, id, name]) => [String(id), String(name)]),
    );
    const paymentCalls = runAsync.mock.calls.filter(([sql]) =>
      String(sql).includes("INSERT INTO payments"),
    );
    const paymentsByDebt = new Map<string, { total: number; latest?: string }>();

    for (const [, , debtId, amount, paidAt] of paymentCalls) {
      const key = String(debtId);
      const current = paymentsByDebt.get(key) ?? { total: 0 };
      current.total += Number(amount);
      current.latest =
        !current.latest || String(paidAt) > current.latest ? String(paidAt) : current.latest;
      paymentsByDebt.set(key, current);
    }

    const debts: DebtCardView[] = runAsync.mock.calls
      .filter(([sql]) => String(sql).includes("INSERT INTO debts"))
      .map((call) => {
        const id = String(call[1]);
        const personId = String(call[2]);
        const originalAmount = Number(call[4]);
        const payment = paymentsByDebt.get(id);
        const remaining = originalAmount - (payment?.total ?? 0);
        const dueDateISO = String(call[7]);
        const name = people.get(personId) ?? "Unknown";
        const status = computeDebtStatus({
          originalAmount,
          remainingAmount: remaining,
          dueDate: dueDateISO,
          now: NOW,
        });

        return {
          id,
          personId,
          name,
          initials: name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2),
          direction: String(call[3]) as DebtDirection,
          amount: originalAmount,
          remaining,
          lastPaymentAt: payment?.latest,
          currency: String(call[5]),
          dueDate: dueDateISO,
          dueDateISO,
          reason: String(call[6]),
          subtitle: String(call[6]),
          status: status === "archived" ? "active" : status,
          createdAt: String(call[12]),
          addedDate: "",
          payments: [],
          reminder: Number(call[9]) === 1,
        };
      });

    const briefing = buildHomeBriefing(debts, NOW);
    const newestPaymentTimes = paymentCalls
      .map((call) => new Date(String(call[4])).getTime())
      .sort((a, b) => b - a);

    expect(people.size).toBe(REALISTIC_SEED_PEOPLE_COUNT);
    expect(briefing.attentionDebts).toHaveLength(5);
    expect(briefing.upcoming.count).toBe(7);
    expect(briefing.upcoming.owedToYou).toBeGreaterThan(0);
    expect(briefing.upcoming.youOwe).toBeGreaterThan(0);
    expect(briefing.attentionCount).toBeGreaterThanOrEqual(5);
    expect(NOW.getTime() - newestPaymentTimes[2]).toBeLessThan(48 * 60 * 60 * 1000);
  });
});
