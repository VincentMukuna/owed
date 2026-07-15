import { describe, expect, it } from "vitest";

import { formatDebtFallbackMeta } from "./debt-card-meta";

const NOW = new Date(2026, 6, 15, 12);

describe("formatDebtFallbackMeta", () => {
  it("describes dates that need immediate attention", () => {
    expect(formatDebtFallbackMeta("2026-07-14", "overdue", NOW)).toBe("Overdue by 1 day");
    expect(formatDebtFallbackMeta("2026-07-15", "due-soon", NOW)).toBe("Due today");
    expect(formatDebtFallbackMeta("2026-07-16", "due-soon", NOW)).toBe("Due tomorrow");
  });

  it("uses useful status and future-date metadata", () => {
    expect(formatDebtFallbackMeta("2026-07-20", "partial", NOW)).toBe("Partially paid");
    expect(formatDebtFallbackMeta("2026-08-01", "active", NOW)).toBe("Due in 17 days");
    expect(formatDebtFallbackMeta("2026-07-01", "paid", NOW)).toBe("Paid in full");
  });
});
