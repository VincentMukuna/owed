export type ActivityPageCursor = {
  occurredAt: string;
  id: string;
};

export type ActivityChronologicalOrder = "asc" | "desc";

export type ActivityPaginationClause = {
  orderSql: "ASC" | "DESC";
  params: string[];
  whereSql: string;
};

export function buildActivityPaginationClause(
  order: ActivityChronologicalOrder,
  cursor?: ActivityPageCursor,
): ActivityPaginationClause {
  const orderSql = order === "desc" ? "DESC" : "ASC";
  if (!cursor) {
    return { orderSql, params: [], whereSql: "" };
  }

  const comparison = order === "desc" ? "<" : ">";
  return {
    orderSql,
    params: [cursor.occurredAt, cursor.occurredAt, cursor.id],
    whereSql: `WHERE ae.occurred_at ${comparison} ? OR (ae.occurred_at = ? AND ae.id ${comparison} ?)`,
  };
}
