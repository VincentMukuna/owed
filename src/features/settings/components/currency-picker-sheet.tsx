import {
  type ComponentType,
  type ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { Platform, StyleSheet, Text, type TextInput, View } from "react-native";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlashList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Check, Search } from "lucide-react-native";
import { FullWindowOverlay } from "react-native-screens";

import { PressableScale } from "@/components/shared/pressable-scale";
import { CURRENCIES, type CurrencyOption } from "@/features/settings/lib/currencies";
import { selectionChange } from "@/lib/haptics";

const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

export type CurrencyPickerSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type CurrencyPickerSheetProps = {
  value: string;
  onSelect: (code: string) => void;
};

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

export const CurrencyPickerSheet = forwardRef<CurrencyPickerSheetRef, CurrencyPickerSheetProps>(
  ({ value, onSelect }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const inputRef = useRef<TextInput>(null);
    const pendingSelectionRef = useRef<string | null>(null);
    const [query, setQuery] = useState("");
    const snapPoints = useMemo(() => ["90%"], []);

    useImperativeHandle(
      ref,
      () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const filtered = useMemo(() => {
      return CURRENCIES.filter((currency) => matchesQuery(currency, query));
    }, [query]);

    const close = useCallback(() => {
      sheetRef.current?.dismiss();
    }, []);

    const selectCurrency = useCallback(
      (code: string) => {
        selectionChange();
        pendingSelectionRef.current = code;
        close();
      },
      [close],
    );

    const handleSheetChange = useCallback((index: number) => {
      if (index >= 0) {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, []);

    const handleDismiss = useCallback(() => {
      setQuery("");
      const code = pendingSelectionRef.current;
      if (code) {
        pendingSelectionRef.current = null;
        onSelect(code);
      }
    }, [onSelect]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: CurrencyOption }) => {
        const selected = item.code === value;

        return (
          <PressableScale
            onPress={() => selectCurrency(item.code)}
            style={[styles.row, selected && styles.rowSelected]}
          >
            <View style={styles.rowCopy}>
              <Text style={styles.rowCode}>{item.code}</Text>
              <Text numberOfLines={1} style={styles.rowName}>
                {item.name}
              </Text>
            </View>
            {selected ? <Check color="#1A3A2A" size={18} strokeWidth={2.5} /> : null}
          </PressableScale>
        );
      },
      [selectCurrency, value],
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
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        containerComponent={SHEET_CONTAINER}
        onChange={handleSheetChange}
        onDismiss={handleDismiss}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Default currency</Text>
        </View>
        <View style={styles.searchWrap}>
          <Search color="#8A8A82" size={18} strokeWidth={1.75} />
          <BottomSheetTextInput
            ref={inputRef as never}
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search currencies"
            placeholderTextColor="#C8C8C0"
            style={styles.searchInput}
            value={query}
          />
        </View>
        <BottomSheetFlashList
          data={filtered}
          keyExtractor={keyExtractor as never}
          renderItem={renderItem as never}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetModal>
    );
  },
);

CurrencyPickerSheet.displayName = "CurrencyPickerSheet";

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#FBFBF8",
  },
  handle: {
    backgroundColor: "#DDDDD8",
    width: 36,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A18",
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(26,58,42,0.25)",
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowCode: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A18",
  },
  rowName: {
    fontSize: 13,
    color: "#8A8A82",
  },
  empty: {
    paddingTop: 40,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#A8A8A0",
    textAlign: "center",
    lineHeight: 19,
  },
});
