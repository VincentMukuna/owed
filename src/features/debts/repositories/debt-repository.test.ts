import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { migration as initial } from "@/lib/db/migrations/001-initial";
import { migration as direction } from "@/lib/db/migrations/005-debt-direction";
import type { DebtDirection } from "@/types";

import { debtRepository } from "./debt-repository";

const { connection } = vi.hoisted(() => ({ connection: { db: null as unknown } }));
vi.mock("@/lib/db/client", () => ({ getDb: async () => connection.db }));

let sqlite: DatabaseSync;
const params = (args: unknown[]): SQLInputValue[] =>
  (Array.isArray(args[0]) ? args[0] : args) as SQLInputValue[];

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(initial.sql);
  sqlite.exec(direction.sql);
  connection.db = {
    runAsync: async (sql: string, ...args: unknown[]) => sqlite.prepare(sql).run(...params(args)),
    getFirstAsync: async (sql: string, ...args: unknown[]) =>
      sqlite.prepare(sql).get(...params(args)),
    getAllAsync: async (sql: string, ...args: unknown[]) =>
      sqlite.prepare(sql).all(...params(args)),
    withTransactionAsync: async (work: () => Promise<void>) => {
      sqlite.exec("BEGIN");
      try {
        await work();
        sqlite.exec("COMMIT");
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
});

afterEach(() => sqlite.close());

describe("changing debt direction", () => {
  it.each<DebtDirection>(["they_owe_me", "i_owe_them"])(
    "changes %s while preserving payments and updating summaries",
    async (originalDirection) => {
      const debt = await debtRepository.create({
        person: { kind: "new", name: "Avery" },
        direction: originalDirection,
        originalAmount: 1000,
        dueDate: "2026-11-15",
        currency: "KES",
        reminderEnabled: false,
      });
      const paid = await debtRepository.recordPayment(debt.id, {
        amount: 250,
        paidAt: "2026-11-01T10:00:00.000Z",
        note: "First payment",
      });
      const nextDirection = originalDirection === "they_owe_me" ? "i_owe_them" : "they_owe_me";
      const updated = await debtRepository.update(debt.id, {
        direction: nextDirection,
        originalAmount: 1000,
        dueDate: debt.dueDate,
        reminderEnabled: false,
      });

      expect(updated.direction).toBe(nextDirection);
      expect(updated.remainingAmount).toBe(750);
      expect(updated.payments).toEqual(paid.payments);
      expect(await debtRepository.listSummaries()).toEqual([
        expect.objectContaining({ direction: nextDirection, remainingAmount: 750 }),
      ]);
      const now = new Date("2026-11-15T12:00:00.000Z");
      expect(await debtRepository.sumPaymentsInMonth({ now, direction: originalDirection })).toBe(
        0,
      );
      expect(await debtRepository.sumPaymentsInMonth({ now, direction: nextDirection })).toBe(250);

      await expect(
        debtRepository.update(debt.id, {
          direction: originalDirection,
          originalAmount: 100,
          dueDate: debt.dueDate,
          reminderEnabled: false,
        }),
      ).rejects.toThrow("Debt amount cannot be less than payments already recorded");
      expect((await debtRepository.getById(debt.id))?.direction).toBe(nextDirection);
    },
  );
});
