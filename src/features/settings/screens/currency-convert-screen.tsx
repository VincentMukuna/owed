import { useCallback, useEffect, useMemo, useState } from "react";

import { ScrollView, Text, TextInput, View } from "react-native";

import { type Href, Stack, router, useLocalSearchParams } from "expo-router";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import {
  KEYBOARD_DONE_ACCESSORY_ID,
  KeyboardDoneAccessory,
} from "@/components/ui/keyboard-done-accessory";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { debtRepository } from "@/features/debts/repositories/debt-repository";
import {
  useChangeCurrency,
  useCurrentCurrency,
} from "@/features/settings/hooks/use-change-currency";
import { useSuggestedExchangeRate } from "@/features/settings/hooks/use-suggested-exchange-rate";
import { isValidCurrencyCode } from "@/features/settings/lib/currencies";
import {
  formatRateDate,
  formatRateForInput,
} from "@/features/settings/lib/fetch-suggested-exchange-rate";
import { parseExchangeRate } from "@/features/settings/lib/parse-exchange-rate";
import { formatCurrency } from "@/lib/utils/formatters";

function dismissCurrencyFlow() {
  if (router.canDismiss()) {
    router.dismiss(2);
    return;
  }

  router.replace("/settings" as Href);
}

export function CurrencyConvertScreen() {
  const { theme } = useUnistyles();
  const params = useLocalSearchParams<{ to?: string }>();
  const toCurrency = typeof params.to === "string" ? params.to.toUpperCase() : "";
  const defaultCurrency = useCurrentCurrency();
  const changeCurrency = useChangeCurrency();

  const [totalRemaining, setTotalRemaining] = useState<number | null>(null);
  const [userRateText, setUserRateText] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const isValidTarget =
    isValidCurrencyCode(toCurrency) && toCurrency !== defaultCurrency.toUpperCase();

  useEffect(() => {
    if (!isValidTarget) {
      router.back();
    }
  }, [isValidTarget]);

  useEffect(() => {
    if (!isValidTarget) {
      return;
    }

    let cancelled = false;

    void debtRepository
      .getTotalRemaining()
      .then((total) => {
        if (!cancelled) {
          setTotalRemaining(total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isValidTarget]);

  const {
    data: suggestedRate,
    isPending: isSuggestedRatePending,
    isSuccess: isSuggestedRateSuccess,
  } = useSuggestedExchangeRate({
    fromCurrency: defaultCurrency,
    toCurrency,
    enabled: isValidTarget,
  });

  const rateText = useMemo(() => {
    if (userRateText !== null) {
      return userRateText;
    }

    if (!suggestedRate) {
      return "";
    }

    return formatRateForInput(suggestedRate.rate);
  }, [userRateText, suggestedRate]);

  const rate = useMemo(() => parseExchangeRate(rateText), [rateText]);
  const convertedTotal =
    totalRemaining === null || rate === undefined ? undefined : Math.round(totalRemaining * rate);

  const canConvert = rate !== undefined && totalRemaining !== null && isValidTarget;

  const handleConvert = useCallback(() => {
    if (!canConvert || rate === undefined) {
      return;
    }

    changeCurrency.mutate(
      {
        fromCurrency: defaultCurrency,
        toCurrency,
        rate,
      },
      {
        onSuccess: () => {
          dismissCurrencyFlow();
        },
      },
    );
  }, [canConvert, changeCurrency, defaultCurrency, rate, toCurrency]);

  if (!isValidTarget) {
    return null;
  }

  if (loadError) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Couldn&apos;t load unsettled amounts.</Text>
      </View>
    );
  }

  if (totalRemaining === null) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Switch to ${toCurrency}`,
          headerRight: () => (
            <HeaderSaveButton
              disabled={!canConvert || changeCurrency.isPending}
              label={changeCurrency.isPending ? "Converting…" : "Convert"}
              onPress={handleConvert}
            />
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.convertForm}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.convertSubtitle}>
          We&apos;ll convert your unsettled amounts from {defaultCurrency} to {toCurrency}. Adjust
          the rate if needed before confirming.
        </Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Exchange rate</Text>
          <View style={styles.inputCard}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>1 {defaultCurrency} =</Text>
              <TextInput
                autoFocus
                editable={!changeCurrency.isPending}
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                keyboardType="decimal-pad"
                onChangeText={setUserRateText}
                placeholder="0.00"
                placeholderTextColor={theme.colors.placeholder}
                returnKeyType="done"
                style={styles.rateInput}
                value={rateText}
              />
              <Text style={styles.rateSuffix}>{toCurrency}</Text>
            </View>
          </View>
          {isSuggestedRatePending ? (
            <Text style={styles.hint}>Fetching suggested rate…</Text>
          ) : null}
          {isSuggestedRateSuccess && suggestedRate ? (
            <Text style={styles.hint}>
              Suggested rate ({formatRateDate(suggestedRate.date)}). Confirm before converting.
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Total unsettled</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewValue}>
              {formatCurrency(totalRemaining, defaultCurrency)}
              {convertedTotal !== undefined ? (
                <Text style={styles.previewArrow}>
                  {" "}
                  → {formatCurrency(convertedTotal, toCurrency)}
                </Text>
              ) : (
                <Text style={styles.previewMuted}> → …</Text>
              )}
            </Text>
          </View>
        </View>
      </ScrollView>
      <KeyboardDoneAccessory />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  convertForm: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 18,
  },
  convertSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.muted,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  inputCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === "light" ? 0.025 : 0.05,
    shadowRadius: theme.name === "light" ? 1.5 : 2,
    elevation: theme.name === "light" ? 0 : 1,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  rateInput: {
    flex: 1,
    minWidth: 80,
    paddingHorizontal: 0,
    paddingVertical: 4,
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  rateSuffix: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  previewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === "light" ? 0.025 : 0.05,
    shadowRadius: theme.name === "light" ? 1.5 : 2,
    elevation: theme.name === "light" ? 0 : 1,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  previewArrow: {
    color: theme.colors.primary,
  },
  previewMuted: {
    color: theme.colors.placeholder,
  },
  error: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
  },
}));
