import { describe, expect, it } from "vitest";

import type { PersonListItemView } from "../view-models";
import { filterAndSortPeople, sortPeople } from "./people-list-utils";

function person(id: string, overrides: Partial<PersonListItemView> = {}): PersonListItemView {
  return {
    id,
    name: id,
    initials: id.slice(0, 2).toUpperCase(),
    outstanding: 0,
    owedToYou: 0,
    youOwe: 0,
    openDebtCount: 0,
    owedToYouOpenCount: 0,
    youOweOpenCount: 0,
    overdueCount: 0,
    owedToYouOverdueCount: 0,
    youOweOverdueCount: 0,
    dueSoonCount: 0,
    owedToYouDueSoonCount: 0,
    youOweDueSoonCount: 0,
    status: "none",
    lastActivityAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("People ordering", () => {
  it("uses deterministic attention buckets and relevant dates", () => {
    const result = sortPeople([
      person("settled", { status: "settled" }),
      person("active-small", { status: "active", owedToYou: 100 }),
      person("due-later", { status: "due-soon", earliestDueSoonDate: "2026-07-17" }),
      person("overdue-recent", {
        status: "overdue",
        earliestOverdueDate: "2026-07-10",
      }),
      person("active-large", { status: "active", youOwe: 500 }),
      person("overdue-old", { status: "overdue", earliestOverdueDate: "2026-07-01" }),
      person("due-next", { status: "due-soon", earliestDueSoonDate: "2026-07-16" }),
    ]);

    expect(result.map(({ id }) => id)).toEqual([
      "overdue-old",
      "overdue-recent",
      "due-next",
      "due-later",
      "active-large",
      "active-small",
      "settled",
    ]);
  });

  it("keeps zero directional balances last for least-first ordering", () => {
    const result = sortPeople(
      [
        person("none", { owedToYou: 0 }),
        person("large", { owedToYou: 800 }),
        person("small", { owedToYou: 50 }),
      ],
      { criterion: "owed-to-you", direction: "asc" },
    );

    expect(result.map(({ id }) => id)).toEqual(["small", "large", "none"]);
  });

  it("retains the selected order after search", () => {
    const result = filterAndSortPeople(
      [
        person("a", { name: "Brian A", youOwe: 20 }),
        person("b", { name: "Brian B", youOwe: 90 }),
        person("c", { name: "Wanjiku", youOwe: 500 }),
      ],
      "brian",
      { criterion: "you-owe", direction: "desc" },
    );

    expect(result.map(({ id }) => id)).toEqual(["b", "a"]);
  });
});
