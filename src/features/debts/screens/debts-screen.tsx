import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type LayoutChangeEvent, Platform, Pressable, Text, View } from "react-native";

import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { type Href, router, useLocalSearchParams } from "expo-router";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import type { FlashListRef } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, List, Search, SlidersHorizontal, X } from "lucide-react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { DebtList } from "@/components/debts/debt-list";
import { DebtSearchBar, type DebtSearchBarRef } from "@/components/debts/debt-search-bar";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { IconButton } from "@/components/shared/icon-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { TabListScreenSkeleton } from "@/components/ui/screen-skeletons";
import type { DebtAction } from "@/features/debts/components/debt-actions-menu";
import { DueDatePickerModal } from "@/features/debts/components/due-date-picker-modal";
import {
  RecordPaymentSheet,
  type RecordPaymentSheetRef,
} from "@/features/debts/components/record-payment-sheet";
import { useArchiveDebt } from "@/features/debts/hooks/use-archive-debt";
import { useDebts } from "@/features/debts/hooks/use-debts";
import { confirmArchiveDebt } from "@/features/debts/lib/archive-confirmation";
import {
  type DebtDateRangeFilter,
  type DebtDirectionFilter,
  type DebtFilterKey,
  computeDebtDirectionCounts,
  computeDebtTabCounts,
  filterDebtsByDueDate,
  filterSearchAndSortDebts,
} from "@/features/debts/lib/debt-list-utils";
import { formatDueDate, toISODate } from "@/features/debts/lib/format-dates";
import type { DebtCardView } from "@/features/debts/view-models";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { selectionChange } from "@/lib/haptics";
import { invalidateDebtQueries } from "@/lib/query/invalidate-queries";
import type { ReminderType } from "@/types";

type DebtFocus = { kind: "date"; date: string; type: ReminderType } | { kind: "paid-this-month" };
type DateRangeTarget = "from" | "to";

const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

type OptimisticParam<TKey extends string> = {
  baseParam: TKey | null;
  value: TKey;
};

function parseFilterParam(value: string | string[] | undefined): DebtFilterKey | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  if (
    value === "all" ||
    value === "active" ||
    value === "overdue" ||
    value === "paid" ||
    value === "due-soon"
  ) {
    return value;
  }

  return null;
}

function parseDirectionParam(value: string | string[] | undefined): DebtDirectionFilter | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  if (value === "all" || value === "they_owe_me" || value === "i_owe_them") {
    return value;
  }

  return null;
}

type FilterTabItem<TKey extends string> = {
  key: TKey;
  label: string;
  count?: number;
};

type FilterTabsProps<TKey extends string> = {
  canUseLiquidGlass: boolean;
  items: FilterTabItem<TKey>[];
  onSelect: (key: TKey) => void;
  selected: TKey;
};

function FilterTabs<TKey extends string>({
  canUseLiquidGlass,
  items,
  onSelect,
  selected,
}: FilterTabsProps<TKey>) {
  const { theme } = useUnistyles();
  const [containerWidth, setContainerWidth] = useState(0);
  const selectedIndex = Math.max(
    items.findIndex((item) => item.key === selected),
    0,
  );
  const indicatorIndex = useSharedValue(selectedIndex);

  useEffect(() => {
    indicatorIndex.value = withTiming(selectedIndex, { duration: 220 });
  }, [indicatorIndex, selectedIndex]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const indicatorStyle = useAnimatedStyle(() => {
    const itemWidth = items.length > 0 ? Math.max(containerWidth - 8, 0) / items.length : 0;

    return {
      width: itemWidth,
      transform: [{ translateX: indicatorIndex.value * itemWidth }],
    };
  });

  return (
    <View onLayout={handleLayout} style={[styles.tabs, canUseLiquidGlass && styles.tabsGlass]}>
      {canUseLiquidGlass ? (
        <GlassView
          colorScheme={theme.name}
          glassEffectStyle="clear"
          style={styles.tabsGlassBackdrop}
          tintColor={theme.colors.surface}
        />
      ) : null}
      {canUseLiquidGlass && containerWidth > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.tabGlassIndicator, indicatorStyle]}>
          <GlassView
            colorScheme={theme.name}
            glassEffectStyle="regular"
            style={styles.tabGlassBackdrop}
            tintColor={theme.colors.card}
          />
        </Animated.View>
      ) : null}
      {items.map((tab, index) => {
        const active = selected === tab.key;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            onPressIn={() => {
              if (canUseLiquidGlass) {
                indicatorIndex.value = withTiming(index, { duration: 220 });
              }
            }}
            style={[styles.tab, active && !canUseLiquidGlass && styles.tabActive]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DebtsScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const archiveDebt = useArchiveDebt();
  const { data: debts = [], isPending } = useDebts();
  const params = useLocalSearchParams<{
    focusDate?: string;
    focusType?: string;
    filter?: string;
    direction?: string;
  }>();
  const paramFilter = useMemo(() => parseFilterParam(params.filter), [params.filter]);
  const paramDirection = useMemo(() => parseDirectionParam(params.direction), [params.direction]);
  const [optimisticFilter, setOptimisticFilter] = useState<OptimisticParam<DebtFilterKey> | null>(
    null,
  );
  const [optimisticDirection, setOptimisticDirection] =
    useState<OptimisticParam<DebtDirectionFilter> | null>(null);
  const [dateRange, setDateRange] = useState<DebtDateRangeFilter>({});
  const filter =
    optimisticFilter && (paramFilter === null || paramFilter === optimisticFilter.baseParam)
      ? optimisticFilter.value
      : (paramFilter ?? "all");
  const direction =
    optimisticDirection &&
    (paramDirection === null || paramDirection === optimisticDirection.baseParam)
      ? optimisticDirection.value
      : (paramDirection ?? "all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DateRangeTarget | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const listRef = useRef<FlashListRef<DebtCardView>>(null);
  const searchRef = useRef<DebtSearchBarRef>(null);
  const filtersSheetRef = useRef<BottomSheetModal>(null);
  const paymentSheetRef = useRef<RecordPaymentSheetRef>(null);
  const [paymentDebt, setPaymentDebt] = useState<DebtCardView | null>(null);
  const filterSheetSnapPoints = useMemo(() => ["56%"], []);
  const todayIso = useMemo(() => toISODate(new Date()), []);
  const canUseLiquidGlass =
    Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  const focus = useMemo<DebtFocus | null>(() => {
    if (params.focusType === "paid-this-month") {
      return { kind: "paid-this-month" };
    }

    const focusDate = params.focusDate;
    if (typeof focusDate !== "string" || focusDate.length === 0) {
      return null;
    }
    return {
      kind: "date",
      date: focusDate,
      type: params.focusType === "overdue" ? "overdue" : "due",
    };
  }, [params.focusDate, params.focusType]);

  const clearFocus = useCallback(() => {
    router.setParams({ focusDate: "", focusType: "" });
  }, []);

  const directionCounts = useMemo(
    () => computeDebtDirectionCounts(debts, dateRange),
    [debts, dateRange],
  );
  const tabCounts = useMemo(
    () => computeDebtTabCounts(debts, direction, dateRange),
    [debts, direction, dateRange],
  );

  const directionTabs = useMemo(
    () => [
      { key: "all" as const, label: "All", count: directionCounts.all },
      { key: "they_owe_me" as const, label: "Owed to you", count: directionCounts.they_owe_me },
      { key: "i_owe_them" as const, label: "You owe", count: directionCounts.i_owe_them },
    ],
    [directionCounts],
  );

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: "All", count: tabCounts.all },
      { key: "active" as const, label: "Active", count: tabCounts.active },
      { key: "overdue" as const, label: "Overdue", count: tabCounts.overdue },
      { key: "paid" as const, label: "Paid", count: tabCounts.paid },
    ],
    [tabCounts.active, tabCounts.all, tabCounts.overdue, tabCounts.paid],
  );

  const visibleDebts = useMemo(
    () =>
      focus?.kind === "date"
        ? filterDebtsByDueDate(debts, focus.date)
        : focus?.kind === "paid-this-month"
          ? filterSearchAndSortDebts(debts, "paid-this-month", deferredSearchQuery, "all")
          : filterSearchAndSortDebts(debts, filter, deferredSearchQuery, direction, dateRange),
    [debts, filter, deferredSearchQuery, direction, dateRange, focus],
  );

  useEffect(() => {
    listRef.current?.scrollToTop({ animated: false });
  }, [filter, deferredSearchQuery, direction, dateRange, focus]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [searchOpen]);

  const openSearch = useCallback(() => {
    selectionChange();
    clearFocus();
    setSearchOpen(true);
  }, [clearFocus]);

  const handleDebtAction = useCallback(
    (action: DebtAction, debt: DebtCardView) => {
      if (action === "record-payment") {
        setPaymentDebt(debt);
        requestAnimationFrame(() => paymentSheetRef.current?.present());
        return;
      }

      if (action === "edit-debt") {
        router.push(`/edit-debt?debtId=${debt.id}` as Href);
        return;
      }

      confirmArchiveDebt(debt, () => {
        archiveDebt.mutate({ debtId: debt.id });
      });
    },
    [archiveDebt],
  );

  const toggleFilters = useCallback(() => {
    selectionChange();
    if (filtersOpen) {
      filtersSheetRef.current?.dismiss();
      return;
    }
    filtersSheetRef.current?.present();
  }, [filtersOpen]);

  const handleFiltersSheetChange = useCallback((index: number) => {
    setFiltersOpen(index >= 0);
  }, []);

  const renderFilterBackdrop = useCallback(
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

  const selectFilter = useCallback(
    (key: DebtFilterKey) => {
      selectionChange();
      clearFocus();
      setOptimisticFilter({ baseParam: paramFilter, value: key });
      router.setParams({ filter: "" });
    },
    [clearFocus, paramFilter],
  );

  const selectDirection = useCallback(
    (key: DebtDirectionFilter) => {
      selectionChange();
      clearFocus();
      setOptimisticDirection({ baseParam: paramDirection, value: key });
      router.setParams({ direction: "" });
    },
    [clearFocus, paramDirection],
  );

  const openDatePicker = useCallback(
    (target: DateRangeTarget) => {
      selectionChange();
      clearFocus();
      setDatePickerTarget(target);
    },
    [clearFocus],
  );

  const saveRangeDate = useCallback(
    (isoDate: string) => {
      setDateRange((current) => {
        if (datePickerTarget === "from") {
          return {
            from: isoDate,
            to: current.to && current.to < isoDate ? isoDate : current.to,
          };
        }

        if (datePickerTarget === "to") {
          return {
            from: current.from && current.from > isoDate ? isoDate : current.from,
            to: isoDate,
          };
        }

        return current;
      });
    },
    [datePickerTarget],
  );

  const clearRangeDate = useCallback(
    (target: DateRangeTarget) => {
      selectionChange();
      clearFocus();
      setDateRange((current) => ({ ...current, [target]: undefined }));
    },
    [clearFocus],
  );

  const resetFilters = useCallback(() => {
    selectionChange();
    clearFocus();
    setOptimisticDirection({ baseParam: paramDirection, value: "all" });
    setOptimisticFilter({ baseParam: paramFilter, value: "all" });
    setDateRange({});
    router.setParams({ direction: "", filter: "" });
  }, [clearFocus, paramDirection, paramFilter]);

  const closeSearch = useCallback(() => {
    setSearchQuery("");
    setSearchOpen(false);
  }, []);

  const openDebt = useCallback((debtId: string) => {
    router.push(`/debt/${debtId}`);
  }, []);

  const openAdd = useCallback(() => {
    router.push("/add-debt");
  }, []);

  const handleRefresh = useCallback(() => invalidateDebtQueries(queryClient), [queryClient]);
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  const isSearching = searchQuery.trim().length > 0;
  const hasDateRangeFilter = Boolean(dateRange.from || dateRange.to);
  const hasActiveFilters = direction !== "all" || filter !== "all" || hasDateRangeFilter;
  const datePickerValue =
    datePickerTarget === "to"
      ? (dateRange.to ?? dateRange.from ?? todayIso)
      : (dateRange.from ?? dateRange.to ?? todayIso);
  const focusBannerText = useMemo(() => {
    if (!focus) {
      return "";
    }

    if (focus.kind === "paid-this-month") {
      return `${visibleDebts.length} settled this month`;
    }

    return focus.type === "overdue"
      ? `${visibleDebts.length} overdue from ${formatDueDate(focus.date)}`
      : `${visibleDebts.length} promised on ${formatDueDate(focus.date)}`;
  }, [focus, visibleDebts.length]);

  const emptyState = useMemo(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          {isSearching ? (
            <Search color={theme.colors.mutedLight} size={20} strokeWidth={1.5} />
          ) : (
            <List color={theme.colors.mutedLight} size={20} strokeWidth={1.5} />
          )}
        </View>
        <Text style={styles.emptyTitle}>{isSearching ? "No matches" : "Nothing here"}</Text>
        <Text style={styles.emptyCopy}>
          {isSearching
            ? "Try a different name or reason."
            : direction === "they_owe_me"
              ? "Money people owe you will appear here."
              : direction === "i_owe_them"
                ? "Money you need to pay back will appear here."
                : "Add a promise to remember money between you and someone else."}
        </Text>
      </View>
    ),
    [direction, isSearching, theme.colors.mutedLight],
  );

  if (isPending) {
    return (
      <TabScreen>
        <TabListScreenSkeleton />
      </TabScreen>
    );
  }

  return (
    <BottomSheetModalProvider>
      <TabScreen>
        <View style={styles.header}>
          {searchOpen ? (
            <>
              <DebtSearchBar
                ref={searchRef}
                onChangeText={setSearchQuery}
                value={searchQuery}
                variant="header"
              />
              <Pressable hitSlop={8} onPress={closeSearch} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Debts</Text>
              <View style={styles.headerActions}>
                <IconButton onPress={toggleFilters}>
                  <SlidersHorizontal
                    color={
                      hasActiveFilters || filtersOpen ? theme.colors.primary : theme.colors.text
                    }
                    size={17}
                    strokeWidth={2}
                  />
                </IconButton>
                <IconButton onPress={openSearch}>
                  <Search color={theme.colors.text} size={17} strokeWidth={2} />
                </IconButton>
              </View>
            </>
          )}
        </View>

        {focus ? (
          <View style={styles.focusBanner}>
            <Text style={styles.focusText} numberOfLines={1}>
              {focusBannerText}
            </Text>
            <PressableScale hitSlop={8} onPress={clearFocus} style={styles.focusClear}>
              <Text style={styles.focusClearText}>Clear</Text>
              <X color={theme.colors.icon} size={14} strokeWidth={2} />
            </PressableScale>
          </View>
        ) : null}

        <DebtList
          ref={listRef}
          contentContainerStyle={styles.scroll}
          debts={visibleDebts}
          ListEmptyComponent={emptyState}
          onDebtAction={handleDebtAction}
          onDebtPress={openDebt}
          refreshControlProps={refreshControlProps}
          showDirectionCue={direction === "all"}
        />

        <FabButton onPress={openAdd} />
      </TabScreen>

      <BottomSheetModal
        ref={filtersSheetRef}
        snapPoints={filterSheetSnapPoints}
        enableDynamicSizing={false}
        backdropComponent={renderFilterBackdrop}
        containerComponent={SHEET_CONTAINER}
        onChange={handleFiltersSheetChange}
        onDismiss={() => setFiltersOpen(false)}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <PressableScale
              hitSlop={8}
              onPress={resetFilters}
              style={styles.sheetReset}
              disabled={!hasActiveFilters}
            >
              <Text style={[styles.sheetResetText, !hasActiveFilters && styles.sheetResetMuted]}>
                Reset
              </Text>
            </PressableScale>
          </View>

          <View style={styles.tabsWrap}>
            <Text style={styles.filterLabel}>Direction</Text>
            <FilterTabs
              canUseLiquidGlass={canUseLiquidGlass}
              items={directionTabs}
              onSelect={selectDirection}
              selected={direction}
            />
          </View>

          <View style={styles.tabsWrap}>
            <Text style={styles.filterLabel}>Status</Text>
            <FilterTabs
              canUseLiquidGlass={canUseLiquidGlass}
              items={tabs}
              onSelect={selectFilter}
              selected={filter}
            />
          </View>

          <View style={styles.tabsWrap}>
            <Text style={styles.filterLabel}>Promised date</Text>
            <View style={styles.dateRangeRow}>
              <DateRangeField
                placeholder="From"
                value={dateRange.from}
                onClear={() => clearRangeDate("from")}
                onPress={() => openDatePicker("from")}
              />
              <Text style={styles.dateRangeSeparator}>-</Text>
              <DateRangeField
                placeholder="To"
                value={dateRange.to}
                onClear={() => clearRangeDate("to")}
                onPress={() => openDatePicker("to")}
              />
            </View>
          </View>
        </View>
      </BottomSheetModal>

      <DueDatePickerModal
        onClose={() => setDatePickerTarget(null)}
        onSave={saveRangeDate}
        value={datePickerValue}
        visible={datePickerTarget !== null}
      />
      <RecordPaymentSheet ref={paymentSheetRef} debt={paymentDebt} />
    </BottomSheetModalProvider>
  );
}

type DateRangeFieldProps = {
  placeholder: string;
  value?: string;
  onPress: () => void;
  onClear: () => void;
};

function DateRangeField({ placeholder, value, onPress, onClear }: DateRangeFieldProps) {
  const { theme } = useUnistyles();

  return (
    <PressableScale onPress={onPress} style={styles.dateField}>
      <Calendar color={theme.colors.muted} size={15} strokeWidth={1.6} />
      <Text style={[styles.dateValue, !value && styles.dateValueEmpty]} numberOfLines={1}>
        {value ? formatDueDate(value) : placeholder}
      </Text>
      {value ? (
        <PressableScale
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onClear();
          }}
          style={styles.dateClear}
          scaleTo={0.9}
        >
          <X color={theme.colors.muted} size={13} strokeWidth={2} />
        </PressableScale>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cancel: {
    flexShrink: 0,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.icon,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetBackground: {
    backgroundColor: theme.colors.sheet,
  },
  sheetHandle: {
    backgroundColor: theme.colors.sheetHandle,
    width: 36,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 2,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },
  sheetReset: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  sheetResetText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  sheetResetMuted: {
    color: theme.colors.mutedLight,
  },
  tabsWrap: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  focusBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  focusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.icon,
  },
  focusClear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  focusClearText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.icon,
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: theme.colors.surface,
    padding: 4,
    borderRadius: 12,
  },
  tabsGlass: {
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  tabsGlassBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
    overflow: "hidden",
    zIndex: 1,
  },
  tabActive: {
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabGlassIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 9,
    overflow: "hidden",
  },
  tabGlassBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 9,
    overflow: "hidden",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  tabTextActive: {
    color: theme.colors.text,
  },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateRangeSeparator: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.muted,
  },
  dateField: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateClear: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dateValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  dateValueEmpty: {
    color: theme.colors.placeholder,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: FAB_SCROLL_PADDING,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.icon,
  },
  emptyCopy: {
    fontSize: 12,
    color: theme.colors.mutedLight,
    marginTop: 4,
  },
}));
