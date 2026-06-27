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

import { Platform, Text, type TextInput, View } from "react-native";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
  useBottomSheetScrollableCreator,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { Check, Plus, Search } from "lucide-react-native";
import { FullWindowOverlay } from "react-native-screens";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { normalizePersonName } from "@/features/debts/lib/person-name";
import type { PersonPickerView, PersonRef } from "@/features/debts/view-models";
import { selectionChange } from "@/lib/haptics";
import { formatCurrency } from "@/lib/utils/formatters";

// On iOS, host the sheet in a FullWindowOverlay so the backdrop covers the
// native nav header too. Android's default container already spans the window.
const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

export type PersonPickerSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type PersonPickerSheetProps = {
  people: PersonPickerView[];
  onSelect: (person: PersonRef, displayName: string) => void;
};

export const PersonPickerSheet = forwardRef<PersonPickerSheetRef, PersonPickerSheetProps>(
  ({ people, onSelect }, ref) => {
    const { theme } = useUnistyles();
    const sheetRef = useRef<BottomSheetModal>(null);
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState("");
    const snapPoints = useMemo(() => ["90%"], []);
    const renderScrollComponent = useBottomSheetScrollableCreator();

    useImperativeHandle(
      ref,
      () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const trimmed = query.trim();
    const normalizedQuery = normalizePersonName(query);

    const filtered = useMemo(() => {
      if (normalizedQuery.length === 0) {
        return people;
      }
      return people.filter((person) => normalizePersonName(person.name).includes(normalizedQuery));
    }, [people, normalizedQuery]);

    const exactMatch = useMemo(() => {
      if (normalizedQuery.length === 0) {
        return undefined;
      }
      return people.find((person) => normalizePersonName(person.name) === normalizedQuery);
    }, [people, normalizedQuery]);

    const close = useCallback(() => {
      sheetRef.current?.dismiss();
    }, []);

    const selectExisting = useCallback(
      (person: PersonPickerView) => {
        selectionChange();
        onSelect({ kind: "existing", id: person.id }, person.name);
        close();
      },
      [onSelect, close],
    );

    const createNew = useCallback(
      (name: string) => {
        const value = name.trim();
        if (value.length === 0) {
          return;
        }
        selectionChange();
        onSelect({ kind: "new", name: value }, value);
        close();
      },
      [onSelect, close],
    );

    // Return key: select the exact match if one exists, otherwise create new.
    // Creating a same-named duplicate stays possible, but only via an explicit tap.
    const handleSubmit = useCallback(() => {
      if (trimmed.length === 0) {
        return;
      }
      if (exactMatch) {
        selectExisting(exactMatch);
        return;
      }
      createNew(trimmed);
    }, [trimmed, exactMatch, selectExisting, createNew]);

    const handleSheetChange = useCallback((index: number) => {
      if (index >= 0) {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, []);

    const handleDismiss = useCallback(() => {
      setQuery("");
    }, []);

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
      ({ item }: { item: PersonPickerView }) => (
        <PersonRow
          person={item}
          isExactMatch={item.id === exactMatch?.id}
          onPress={() => selectExisting(item)}
        />
      ),
      [exactMatch?.id, selectExisting],
    );

    const keyExtractor = useCallback((item: PersonPickerView) => item.id, []);

    const listHeader = useMemo(() => {
      if (trimmed.length === 0) {
        return null;
      }

      // No exact match → the primary action is to add this brand-new name.
      if (!exactMatch) {
        return (
          <PressableScale onPress={() => createNew(trimmed)} style={styles.addRowPrimary}>
            <View style={styles.addIcon}>
              <Plus color={theme.colors.primary} size={18} strokeWidth={2} />
            </View>
            <View style={styles.addCopy}>
              <Text style={styles.addTitle}>Add new person</Text>
              <Text style={styles.addName} numberOfLines={1}>
                “{trimmed}”
              </Text>
            </View>
          </PressableScale>
        );
      }

      // Exact match exists → it's already highlighted in the list. Offer a quiet
      // escape hatch for the rare case of two different people with the same name.
      return (
        <PressableScale onPress={() => createNew(trimmed)} style={styles.addRowSubtle}>
          <Plus color={theme.colors.muted} size={15} strokeWidth={2} />
          <Text style={styles.addSubtleText} numberOfLines={1}>
            Add “{trimmed}” as a new person instead
          </Text>
        </PressableScale>
      );
    }, [trimmed, exactMatch, createNew, theme.colors.muted, theme.colors.primary]);

    const listEmpty = useMemo(() => {
      if (trimmed.length > 0) {
        return null;
      }
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {people.length === 0
              ? "No people yet. Type a name to add the first one."
              : "Start typing to search your people."}
          </Text>
        </View>
      );
    }, [trimmed, people.length]);

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
          <Text style={styles.title}>Person</Text>
        </View>
        <View style={styles.searchWrap}>
          <Search color={theme.colors.muted} size={18} strokeWidth={1.75} />
          <BottomSheetTextInput
            ref={inputRef as never}
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            placeholder="Search or type a name"
            placeholderTextColor={theme.colors.placeholder}
            returnKeyType="done"
            style={styles.searchInput}
            submitBehavior="submit"
            value={query}
          />
        </View>
        <FlashList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderScrollComponent={renderScrollComponent}
        />
      </BottomSheetModal>
    );
  },
);

PersonPickerSheet.displayName = "PersonPickerSheet";

type PersonRowProps = {
  person: PersonPickerView;
  isExactMatch: boolean;
  onPress: () => void;
};

function PersonRow({ person, isExactMatch, onPress }: PersonRowProps) {
  const { theme } = useUnistyles();
  const subtitle =
    person.openDebtCount > 0
      ? `${formatCurrency(person.outstanding)} · ${person.openDebtCount} open`
      : "Settled up";

  return (
    <PressableScale onPress={onPress} style={[styles.row, isExactMatch && styles.rowMatch]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{person.initials}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {person.name}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {isExactMatch ? <Check color={theme.colors.primary} size={18} strokeWidth={2.25} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  sheetBackground: {
    backgroundColor: theme.colors.sheet,
  },
  handle: {
    backgroundColor: theme.colors.sheetHandle,
    width: 36,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
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
    paddingBottom: 24,
  },
  addRowPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.personAddBg,
    borderRadius: 12,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.personAddPressedBg,
  },
  addCopy: {
    flex: 1,
    minWidth: 0,
  },
  addTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  addName: {
    fontSize: 13,
    color: theme.colors.personAddText,
    marginTop: 1,
  },
  addRowSubtle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  addSubtleText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.muted,
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rowMatch: {
    backgroundColor: theme.colors.selected,
    borderWidth: 1,
    borderColor: theme.colors.selectedBorder,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.personNeutralBg,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.personNeutralText,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
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
