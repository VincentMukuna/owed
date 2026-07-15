import { describe, expect, it } from "vitest";

import { buildActivityPaginationClause } from "./activity-pagination";

const CURSOR = { occurredAt: "2026-07-15T10:00:00.000Z", id: "event-2" };

describe("buildActivityPaginationClause", () => {
  it("paginates backward for newest-first feeds", () => {
    expect(buildActivityPaginationClause("desc", CURSOR)).toEqual({
      orderSql: "DESC",
      params: [CURSOR.occurredAt, CURSOR.occurredAt, CURSOR.id],
      whereSql: "WHERE ae.occurred_at < ? OR (ae.occurred_at = ? AND ae.id < ?)",
    });
  });

  it("paginates forward for oldest-first feeds", () => {
    expect(buildActivityPaginationClause("asc", CURSOR)).toEqual({
      orderSql: "ASC",
      params: [CURSOR.occurredAt, CURSOR.occurredAt, CURSOR.id],
      whereSql: "WHERE ae.occurred_at > ? OR (ae.occurred_at = ? AND ae.id > ?)",
    });
  });

  it("starts at the selected end when there is no cursor", () => {
    expect(buildActivityPaginationClause("asc")).toEqual({
      orderSql: "ASC",
      params: [],
      whereSql: "",
    });
  });
});
