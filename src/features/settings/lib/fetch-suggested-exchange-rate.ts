const FRANKFURTER_API = "https://api.frankfurter.dev";

export type SuggestedExchangeRate = {
  rate: number;
  date: string;
};

type FrankfurterRateResponse = {
  date?: string;
  rate?: number;
};

export function formatRateForInput(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) {
    return "";
  }

  return rate
    .toFixed(8)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

export function formatRateDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed);
}

export async function fetchSuggestedExchangeRate(
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<SuggestedExchangeRate | null> {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  if (fromCode === toCode) {
    return { rate: 1, date: new Date().toISOString().slice(0, 10) };
  }

  try {
    const url = `${FRANKFURTER_API}/v2/rate/${encodeURIComponent(fromCode)}/${encodeURIComponent(toCode)}`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as FrankfurterRateResponse;

    if (
      typeof data.rate !== "number" ||
      !Number.isFinite(data.rate) ||
      data.rate <= 0 ||
      typeof data.date !== "string"
    ) {
      return null;
    }

    return { rate: data.rate, date: data.date };
  } catch {
    return null;
  }
}
