import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Text, TextInput, View } from "react-native";

import { type Href, router } from "expo-router";

import { FlashList } from "@shopify/flash-list";
import { Check, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ListRowContainer } from "@/components/shared/list-inset-divider";
import { PressableScale } from "@/components/shared/pressable-scale";
import { debtRepository } from "@/features/debts/repositories/debt-repository";
import {
  useChangeCurrency,
  useCurrentCurrency,
} from "@/features/settings/hooks/use-change-currency";
import { CURRENCIES, type CurrencyOption } from "@/features/settings/lib/currencies";
import { getCurrencyFlag } from "@/features/settings/lib/currency-flags";
import { selectionChange } from "@/lib/haptics";
import { closeModalScreen } from "@/lib/navigation/close-modal-screen";

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
  const insets = useSafeAreaInsets();
  const defaultCurrency = useCurrentCurrency();
  const changeCurrency = useChangeCurrency();
  const searchInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return CURRENCIES.filter((currency) => matchesQuery(currency, query));
  }, [query]);

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

      router.push({ pathname: "/currency-convert", params: { to: code } } as Href);
    },
    [changeCurrency, defaultCurrency],
  );

  useEffect(() => {
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

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
}));
