export const settingsKeys = {
  suggestedExchangeRate: (from: string, to: string) =>
    ["settings", "suggested-exchange-rate", from, to] as const,
};
