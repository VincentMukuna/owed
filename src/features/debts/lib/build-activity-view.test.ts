import { describe, expect, it } from "vitest";

import type { ActivityEventWithRelations } from "@/features/debts/repositories/activity-repository";

import { buildActivityView } from "./build-activity-view";

const NOW = new Date(2026, 6, 15, 20);

function createdEvent(reason?: string): ActivityEventWithRelations {
  return {
    id: "activity-1",
    type: "debt_created",
    debtId: "debt-1",
    personId: "person-1",
    personName: "Byron",
    debtReason: reason,
    debtCurrency: "USD",
    debtDirection: "they_owe_me",
    amount: 30,
    occurredAt: new Date(2026, 6, 15, 19, 10).toISOString(),
    createdAt: new Date(2026, 6, 15, 19, 10).toISOString(),
  };
}

describe("buildActivityView", () => {
  it("uses event metadata when a created debt has no description", () => {
    expect(buildActivityView(createdEvent(), NOW).sub).toBe("Debt created");
  });

  it("keeps the debt description when one exists", () => {
    expect(buildActivityView(createdEvent("Lunch"), NOW).sub).toBe("Lunch");
  });
});
