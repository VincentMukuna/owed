export const debtKeys = {
  all: ["debts"] as const,
  detail: (id: string) => ["debts", id] as const,
};

export const activityKeys = {
  all: ["activities"] as const,
};

export const peopleKeys = {
  all: ["people"] as const,
};
