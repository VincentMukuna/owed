export type SortDirection = "asc" | "desc" | "fixed";

export type SortPreference<TCriterion extends string> = {
  criterion: TCriterion;
  direction: SortDirection;
};

export type SortChoice<TValue extends string> = {
  label: string;
  value: TValue;
};
