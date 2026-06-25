export const debtKeys = {
  all: ["debts"] as const,
  detail: (id: string) => ["debts", id] as const,
};

export const activityKeys = {
  all: ["activities"] as const,
};

export const peopleKeys = {
  all: ["people"] as const,
  list: ["people", "list"] as const,
  detail: (id: string) => ["people", "detail", id] as const,
};
