import { getLocales } from "expo-localization";

import { isValidCurrencyCode } from "@/features/settings/lib/currencies";
import { currencyForRegion } from "@/features/settings/lib/region-currency";

const FALLBACK_CURRENCY = "USD";

export function detectCurrencyFromOs(): string {
  const locale = getLocales()[0];
  const candidates = [locale?.currencyCode, currencyForRegion(locale?.regionCode)];

  for (const candidate of candidates) {
    if (candidate && isValidCurrencyCode(candidate)) {
      return candidate;
    }
  }

  return FALLBACK_CURRENCY;
}
