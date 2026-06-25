import { CURRENCY_DATA } from "@/features/settings/lib/currency-data";

export type CurrencyOption = {
  code: string;
  name: string;
};

/** Static ISO 4217 list — Hermes does not support `Intl.DisplayNames` / `supportedValuesOf`. */
export const CURRENCIES: CurrencyOption[] = [...CURRENCY_DATA];

const CURRENCY_CODES = new Set(CURRENCIES.map((currency) => currency.code));

export function isValidCurrencyCode(code: string): boolean {
  return CURRENCY_CODES.has(code);
}

export function getCurrencyName(code: string): string {
  return CURRENCIES.find((currency) => currency.code === code)?.name ?? code;
}
