const RATE_PATTERN = /^\d+(\.\d{1,8})?$/;

export function parseExchangeRate(value: string): number | undefined {
  const trimmed = value.trim();

  if (!RATE_PATTERN.test(trimmed)) {
    return undefined;
  }

  const rate = Number(trimmed);

  if (!Number.isFinite(rate) || rate <= 0) {
    return undefined;
  }

  return rate;
}
