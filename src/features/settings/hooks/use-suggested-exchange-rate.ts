import { useQuery } from "@tanstack/react-query";

import { fetchSuggestedExchangeRate } from "@/features/settings/lib/fetch-suggested-exchange-rate";

import { settingsKeys } from "./query-keys";

type UseSuggestedExchangeRateOptions = {
  fromCurrency: string;
  toCurrency: string;
  enabled?: boolean;
};

export function useSuggestedExchangeRate({
  fromCurrency,
  toCurrency,
  enabled = true,
}: UseSuggestedExchangeRateOptions) {
  return useQuery({
    queryKey: settingsKeys.suggestedExchangeRate(fromCurrency, toCurrency),
    queryFn: ({ signal }) => fetchSuggestedExchangeRate(fromCurrency, toCurrency, signal),
    enabled: enabled && fromCurrency !== toCurrency,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
