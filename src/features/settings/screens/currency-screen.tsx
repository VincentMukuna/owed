import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { ScrollView, Text, TextInput, View } from "react-native";

import { useNavigation } from "expo-router";

import { FlashList } from "@shopify/flash-list";
import { Check, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { HeaderCloseButton } from "@/components/navigation/header-close-button";
import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import { ListRowContainer } from "@/components/shared/list-inset-divider";
import { PressableScale } from "@/components/shared/pressable-scale";
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
import { CURRENCIES, type CurrencyOption } from "@/features/settings/lib/currencies";
import { getCurrencyFlag } from "@/features/settings/lib/currency-flags";
import {
  formatRateDate,
  formatRateForInput,
} from "@/features/settings/lib/fetch-suggested-exchange-rate";
import { parseExchangeRate } from "@/features/settings/lib/parse-exchange-rate";
import { selectionChange } from "@/lib/haptics";
import { closeModalScreen } from "@/lib/navigation/close-modal-screen";
import { formatCurrency } from "@/lib/utils/formatters";

/** After flag emoji + gap (row padding 10 + lineHeight 26 + gap 12). */
const CURRENCY_LIST_TEXT_INSET = 48;

function matchesQuery(currency: CurrencyOption, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  return (
    currency.code.toLowerCase().includes(normalized) ||
    currency.name.toLowerCase().includes(normalized)
  );
}

export function CurrencyScreen() {
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const defaultCurrency = useCurrentCurrency();
  const changeCurrency = useChangeCurrency();
  const searchInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [conversionTarget, setConversionTarget] = useState<string | null>(null);
  const [totalRemaining, setTotalRemaining] = useState<number | null>(null);
  const [userRateText, setUserRateText] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return CURRENCIES.filter((currency) => matchesQuery(currency, query));
  }, [query]);

  const {
    data: suggestedRate,
    isPending: isSuggestedRatePending,
    isSuccess: isSuggestedRateSuccess,
  } = useSuggestedExchangeRate({
    fromCurrency: defaultCurrency,
    toCurrency: conversionTarget ?? defaultCurrency,
    enabled: conversionTarget !== null && conversionTarget !== defaultCurrency,
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

  const canConvert =
    conversionTarget !== null &&
    rate !== undefined &&
    totalRemaining !== null &&
    conversionTarget !== defaultCurrency;

  const cancelConversion = useCallback(() => {
    setConversionTarget(null);
    setTotalRemaining(null);
    setUserRateText(null);
  }, []);

  const handleConvert = useCallback(() => {
    if (!canConvert || !conversionTarget || rate === undefined) {
      return;
    }

    changeCurrency.mutate(
      {
        fromCurrency: defaultCurrency,
        toCurrency: conversionTarget,
        rate,
      },
      {
        onSuccess: () => {
          closeModalScreen();
        },
      },
    );
  }, [canConvert, changeCurrency, conversionTarget, defaultCurrency, rate]);

  const selectCurrency = useCallback(
    async (code: string) => {
      if (code === defaultCurrency) {
        closeModalScreen();
        return;
      }

      selectionChange();

      const hasDebts = await debtRepository.hasAnyDebts();

      if (!hasDebts) {
        changeCurrency.mutate(
          {
            fromCurrency: defaultCurrency,
            toCurrency: code,
          },
          {
            onSuccess: () => {
              closeModalScreen();
            },
          },
        );
        return;
      }

      setUserRateText(null);
      setConversionTarget(code);
      setTotalRemaining(await debtRepository.getTotalRemaining());
    },
    [changeCurrency, defaultCurrency],
  );

  useLayoutEffect(() => {
    if (conversionTarget) {
      navigation.setOptions({
        title: `Switch to ${conversionTarget}`,
        headerLeft: () => <HeaderCloseButton onPress={cancelConversion} />,
        headerRight: () => (
          <HeaderSaveButton
            disabled={!canConvert || changeCurrency.isPending}
            label={changeCurrency.isPending ? "Converting…" : "Convert"}
            onPress={handleConvert}
          />
        ),
      });
      return;
    }

    navigation.setOptions({
      title: "Currency",
      headerLeft: undefined,
      headerRight: () => <HeaderCloseButton />,
    });
  }, [
    canConvert,
    cancelConversion,
    changeCurrency.isPending,
    conversionTarget,
    handleConvert,
    navigation,
  ]);

  useEffect(() => {
    if (conversionTarget) {
      return;
    }

    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [conversionTarget]);

  const renderItem = useCallback(
    ({ item, index }: { item: CurrencyOption; index: number }) => {
      const selected = item.code === defaultCurrency;

      return (
        <ListRowContainer leadingInset={CURRENCY_LIST_TEXT_INSET} showDivider={index > 0}>
          <PressableScale
            onPress={() => {
              void selectCurrency(item.code);
            }}
            style={[styles.row, selected && styles.rowSelected]}
          >
            <View style={styles.rowLeading}>
              <Text style={styles.rowFlag}>{getCurrencyFlag(item.code)}</Text>
              <View style={styles.rowCopy}>
                <Text style={styles.rowCode}>{item.code}</Text>
                <Text numberOfLines={1} style={styles.rowName}>
                  {item.name}
                </Text>
              </View>
            </View>
            {selected ? <Check color={theme.colors.primary} size={18} strokeWidth={2.5} /> : null}
          </PressableScale>
        </ListRowContainer>
      );
    },
    [defaultCurrency, selectCurrency, theme.colors.primary],
  );

  const keyExtractor = useCallback((item: CurrencyOption) => item.code, []);

  const listEmpty = useMemo(() => {
    if (query.trim().length === 0) {
      return null;
    }

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No currencies match your search.</Text>
      </View>
    );
  }, [query]);

  if (conversionTarget) {
    if (totalRemaining === null) {
      return <LoadingSpinner />;
    }

    return (
      <>
        <ScrollView
          contentContainerStyle={styles.convertForm}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.convertSubtitle}>
            We&apos;ll convert your unsettled amounts from {defaultCurrency} to {conversionTarget}.
            Adjust the rate if needed before confirming.
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
                <Text style={styles.rateSuffix}>{conversionTarget}</Text>
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
                    → {formatCurrency(convertedTotal, conversionTarget)}
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

  return (
    <View style={styles.root}>
      <View style={styles.searchWrap}>
        <Search color={theme.colors.muted} size={18} strokeWidth={1.75} />
        <TextInput
          ref={searchInputRef}
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search currencies"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.searchInput}
          value={query}
        />
      </View>
      <FlashList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rowSelected: {
    backgroundColor: theme.colors.selected,
    borderWidth: 1,
    borderColor: theme.colors.selectedBorder,
  },
  rowLeading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  rowFlag: {
    fontSize: 22,
    lineHeight: 26,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowCode: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  rowName: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  empty: {
    paddingTop: 40,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.mutedLight,
    textAlign: "center",
    lineHeight: 19,
  },
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
}));
