import { APP_CONFIG } from "@/constants/config";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { CURRENCY_SYMBOLS } from "@/features/settings/lib/currency-symbols";

function resolveCurrency(currency?: string): string {
  return currency ?? useSettingsStore.getState().defaultCurrency ?? APP_CONFIG.defaultCurrency;
}

const CURRENCY_FORMAT_OPTIONS = {
  style: "currency" as const,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

/** Intl uses US$ on many locales; bare $ is the conventional USD symbol. */
function normalizeCurrencySymbol(symbol: string): string {
  return symbol === "US$" ? "$" : symbol;
}

function createCurrencyFormatter(code: string): Intl.NumberFormat {
  return new Intl.NumberFormat(undefined, {
    ...CURRENCY_FORMAT_OPTIONS,
    currency: code,
    currencyDisplay: "symbol",
  });
}

/** Hermes does not implement `formatToParts`; fall back to the static symbol map. */
function formatToPartsSafe(
  formatter: Intl.NumberFormat,
  value: number,
): Intl.NumberFormatPart[] | null {
  if (typeof formatter.formatToParts !== "function") {
    return null;
  }
  return formatter.formatToParts(value);
}

function resolveCurrencySymbol(code: string): string {
  const parts = formatToPartsSafe(createCurrencyFormatter(code), 0);
  if (parts) {
    const fromIntl = parts.find((part) => part.type === "currency")?.value;
    if (fromIntl && fromIntl !== code) {
      return normalizeCurrencySymbol(fromIntl);
    }
  }

  return CURRENCY_SYMBOLS[code] ?? code;
}

function formatCurrencyParts(amount: number, code: string): string {
  const symbol = resolveCurrencySymbol(code);
  const formatter = createCurrencyFormatter(code);
  const parts = formatToPartsSafe(formatter, amount);

  if (parts) {
    return parts
      .filter((part) => part.type !== "literal" || !/^\s*$/.test(part.value))
      .map((part) => (part.type === "currency" ? symbol : part.value))
      .join("");
  }

  return `${symbol}${amount.toLocaleString()}`;
}

export function formatCurrency(amount: number, currency?: string): string {
  const code = resolveCurrency(currency);

  try {
    return formatCurrencyParts(amount, code);
  } catch {
    const symbol = CURRENCY_SYMBOLS[code] ?? code;
    return `${symbol}${amount.toLocaleString()}`;
  }
}

/** Short label for amount inputs — symbol when available, otherwise ISO code. */
export function formatCurrencyPrefix(currency?: string): string {
  return resolveCurrencySymbol(resolveCurrency(currency));
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
