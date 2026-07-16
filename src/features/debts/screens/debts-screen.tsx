import {
  type ComponentType,
  type ReactNode,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  InteractionManager,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { type Href, router, useLocalSearchParams } from "expo-router";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { DebtAction } from "@/features/debts/components/debt-actions-menu";
import { DueDatePickerModal } from "@/features/debts/components/due-date-picker-modal";
import { useArchiveDebt } from "@/features/debts/hooks/use-archive-debt";
import { useDebts } from "@/features/debts/hooks/use-debts";
import { confirmArchiveDebt } from "@/features/debts/lib/archive-confirmation";
import {
  DEBT_SORT_CRITERIA,
  DEFAULT_DEBT_SORT,
  type DebtDateRangeFilter,
  type DebtDirectionFilter,
  type DebtFilterKey,
  type DebtSortCriterion,
  computeDebtDirectionCounts,
  computeDebtTabCounts,
  debtSortDirections,
  defaultDebtSortDirection,
  filterDebtsByDueDate,
  filterDebtsNeedingAttention,
  filterSearchAndSortDebts,
  isDebtSortPreference,
} from "@/features/debts/lib/debt-list-utils";
import { formatDueDate, toISODate } from "@/features/debts/lib/format-dates";
import type { DebtCardView } from "@/features/debts/view-models";
import { SortOptionsContent } from "@/features/view-options/components/sort-options-content";
import { useViewPreference } from "@/features/view-options/hooks/use-view-preference";
import type { SortDirection } from "@/features/view-options/types";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { selectionChange } from "@/lib/haptics";
import { invalidateDebtQueries } from "@/lib/query/invalidate-queries";
import type { ReminderType } from "@/types";

type DebtFocus =
  | { kind: "date"; date: string; type: ReminderType }
  | { kind: "attention" }
  | { kind: "paid-this-month" }
  | { kind: "filter"; filter: DebtFilterKey }
  | { kind: "direction"; direction: Exclude<DebtDirectionFilter, "all"> };
type DateRangeTarget = "from" | "to";

const DASHBOARD_FILTER_FOCUS = new Set<DebtFilterKey>(["active", "overdue", "due-soon"]);
const DASHBOARD_DIRECTION_FOCUS = new Set<Exclude<DebtDirectionFilter, "all">>([
  "they_owe_me",
  "i_owe_them",
]);

function parseDashboardFilterFocus(focusType: string): DebtFilterKey | null {
  if (!focusType.startsWith("filter-")) {
    return null;
  }

  const filter = focusType.slice("filter-".length) as DebtFilterKey;
  return DASHBOARD_FILTER_FOCUS.has(filter) ? filter : null;
}

function parseDashboardDirectionFocus(
  focusType: string,
): Exclude<DebtDirectionFilter, "all"> | null {
  if (!focusType.startsWith("direction-")) {
    return null;
  }

  const direction = focusType.slice("direction-".length) as Exclude<DebtDirectionFilter, "all">;
  return DASHBOARD_DIRECTION_FOCUS.has(direction) ? direction : null;
}

const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

function scheduleDashboardFocusClear() {
  InteractionManager.runAfterInteractions(() => {
    router.setParams({ focusDate: "", focusType: "" });
  });
}

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
            onPress={() => {
              if (canUseLiquidGlass) {
                onSelect(tab.key);
              }
            }}
            onPressIn={() => {
              if (canUseLiquidGlass) {
                indicatorIndex.value = withTiming(index, { duration: 220 });
                return;
              }

              onSelect(tab.key);
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

type DebtsFiltersSheetContentProps = {
  canUseLiquidGlass: boolean;
  dateRange: DebtDateRangeFilter;
  direction: DebtDirectionFilter;
  directionTabs: FilterTabItem<DebtDirectionFilter>[];
  filter: DebtFilterKey;
  hasViewChanges: boolean;
  onClearRangeDate: (target: DateRangeTarget) => void;
  onOpenDatePicker: (target: DateRangeTarget) => void;
  onResetView: () => void;
  onSelectDirection: (key: DebtDirectionFilter) => void;
  onSelectFilter: (key: DebtFilterKey) => void;
  onSelectSortCriterion: (criterion: DebtSortCriterion) => void;
  onSelectSortDirection: (direction: SortDirection) => void;
  sortCriterion: DebtSortCriterion;
  sortDirection: SortDirection;
  sortDirections: ReturnType<typeof debtSortDirections>;
  tabs: FilterTabItem<DebtFilterKey>[];
};

function DebtsFiltersSheetContentInner({
  canUseLiquidGlass,
  dateRange,
  direction,
  directionTabs,
  filter,
  hasViewChanges,
  onClearRangeDate,
  onOpenDatePicker,
  onResetView,
  onSelectDirection,
  onSelectFilter,
  onSelectSortCriterion,
  onSelectSortDirection,
  sortCriterion,
  sortDirection,
  sortDirections,
  tabs,
}: DebtsFiltersSheetContentProps) {
  return (
    <View style={styles.sheetContent}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>View options</Text>
        <PressableScale
          hitSlop={8}
          onPress={onResetView}
          style={styles.sheetReset}
          disabled={!hasViewChanges}
        >
          <Text style={[styles.sheetResetText, !hasViewChanges && styles.sheetResetMuted]}>
            Reset all
          </Text>
        </PressableScale>
      </View>

      <View style={styles.tabsWrap}>
        <Text style={styles.filterLabel}>Direction</Text>
        <FilterTabs
          canUseLiquidGlass={canUseLiquidGlass}
          items={directionTabs}
          onSelect={onSelectDirection}
          selected={direction}
        />
      </View>

      <View style={styles.tabsWrap}>
        <Text style={styles.filterLabel}>Status</Text>
        <FilterTabs
          canUseLiquidGlass={canUseLiquidGlass}
          items={tabs}
          onSelect={onSelectFilter}
          selected={filter}
        />
      </View>

      <View style={styles.tabsWrap}>
        <Text style={styles.filterLabel}>Due date</Text>
        <View style={styles.dateRangeRow}>
          <DateRangeField
            placeholder="From"
            value={dateRange.from}
            onClear={() => onClearRangeDate("from")}
            onPress={() => onOpenDatePicker("from")}
          />
          <Text style={styles.dateRangeSeparator}>-</Text>
          <DateRangeField
            placeholder="To"
            value={dateRange.to}
            onClear={() => onClearRangeDate("to")}
            onPress={() => onOpenDatePicker("to")}
          />
        </View>
      </View>

      <SortOptionsContent
        criteria={DEBT_SORT_CRITERIA}
        criterion={sortCriterion}
        direction={sortDirection}
        directions={sortDirections}
        onSelectCriterion={onSelectSortCriterion}
        onSelectDirection={onSelectSortDirection}
      />
    </View>
  );
}

const DebtsFiltersSheetContent = memo(DebtsFiltersSheetContentInner);

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
  const [filter, setFilter] = useState<DebtFilterKey>(() => paramFilter ?? "all");
  const [direction, setDirection] = useState<DebtDirectionFilter>(() => paramDirection ?? "all");
  const deferredFilter = useDeferredValue(filter);
  const deferredDirection = useDeferredValue(direction);
  const [dateRange, setDateRange] = useState<DebtDateRangeFilter>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DateRangeTarget | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const listRef = useRef<FlashListRef<DebtCardView>>(null);
  const searchRef = useRef<DebtSearchBarRef>(null);
  const filtersSheetRef = useRef<BottomSheetModal>(null);
  const filterSheetSnapPoints = useMemo(() => ["88%"], []);
  const {
    isHydrated: isSortHydrated,
    reset: resetSort,
    setValue: setSort,
    value: sort,
  } = useViewPreference({
    defaultValue: DEFAULT_DEBT_SORT,
    isValid: isDebtSortPreference,
    surface: "debts",
  });
  const sortDirections = useMemo(() => debtSortDirections(sort.criterion), [sort.criterion]);
  const todayIso = useMemo(() => toISODate(new Date()), []);
  const focus = useMemo<DebtFocus | null>(() => {
    const focusType = params.focusType;

    if (focusType === "attention") {
      return { kind: "attention" };
    }

    if (focusType === "paid-this-month") {
      return { kind: "paid-this-month" };
    }

    if (typeof focusType === "string" && focusType.length > 0) {
      const dashboardFilter = parseDashboardFilterFocus(focusType);
      if (dashboardFilter) {
        return { kind: "filter", filter: dashboardFilter };
      }

      const dashboardDirection = parseDashboardDirectionFocus(focusType);
      if (dashboardDirection) {
        return { kind: "direction", direction: dashboardDirection };
      }
    }

    const focusDate = params.focusDate;
    if (typeof focusDate !== "string" || focusDate.length === 0) {
      return null;
    }
    return {
      kind: "date",
      date: focusDate,
      type: focusType === "overdue" ? "overdue" : "due",
    };
  }, [params.focusDate, params.focusType]);

  const canUseLiquidGlass =
    Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  const clearDashboardFocusParams = useCallback(() => {
    if (!params.focusType && !params.focusDate) {
      return;
    }

    scheduleDashboardFocusClear();
  }, [params.focusDate, params.focusType]);

  const dismissFocusBanner = useCallback(() => {
    setFilter("all");
    setDirection("all");
    router.setParams({
      focusDate: "",
      focusType: "",
      filter: "",
      direction: "",
    });
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
        ? filterDebtsByDueDate(debts, focus.date, sort)
        : focus?.kind === "attention"
          ? filterDebtsNeedingAttention(debts, sort)
          : focus?.kind === "paid-this-month"
            ? filterSearchAndSortDebts(
                debts,
                "paid-this-month",
                deferredSearchQuery,
                "all",
                undefined,
                sort,
              )
            : focus?.kind === "filter"
              ? filterSearchAndSortDebts(
                  debts,
                  focus.filter,
                  deferredSearchQuery,
                  "all",
                  undefined,
                  sort,
                )
              : focus?.kind === "direction"
                ? filterSearchAndSortDebts(
                    debts,
                    "all",
                    deferredSearchQuery,
                    focus.direction,
                    undefined,
                    sort,
                  )
                : filterSearchAndSortDebts(
                    debts,
                    deferredFilter,
                    deferredSearchQuery,
                    deferredDirection,
                    dateRange,
                    sort,
                  ),
    [debts, deferredFilter, deferredSearchQuery, deferredDirection, dateRange, focus, sort],
  );

  useEffect(() => {
    listRef.current?.scrollToTop({ animated: false });
  }, [deferredFilter, deferredSearchQuery, deferredDirection, dateRange, focus, sort]);

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
    clearDashboardFocusParams();
    setSearchOpen(true);
  }, [clearDashboardFocusParams]);

  const handleDebtAction = useCallback(
    (action: DebtAction, debt: DebtCardView) => {
      if (action === "record-payment") {
        router.push(`/record-payment?debtId=${debt.id}` as Href);
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
      setFilter(key);
      if (params.focusType || params.focusDate) {
        scheduleDashboardFocusClear();
      }
    },
    [params.focusDate, params.focusType],
  );

  const selectDirection = useCallback(
    (key: DebtDirectionFilter) => {
      selectionChange();
      setDirection(key);
      if (params.focusType || params.focusDate) {
        scheduleDashboardFocusClear();
      }
    },
    [params.focusDate, params.focusType],
  );

  const openDatePicker = useCallback(
    (target: DateRangeTarget) => {
      selectionChange();
      clearDashboardFocusParams();
      setDatePickerTarget(target);
    },
    [clearDashboardFocusParams],
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
      clearDashboardFocusParams();
      setDateRange((current) => ({ ...current, [target]: undefined }));
    },
    [clearDashboardFocusParams],
  );

  const selectSortCriterion = useCallback(
    (criterion: DebtSortCriterion) => {
      setSort({ criterion, direction: defaultDebtSortDirection(criterion) });
    },
    [setSort],
  );

  const selectSortDirection = useCallback(
    (sortDirection: SortDirection) => setSort({ ...sort, direction: sortDirection }),
    [setSort, sort],
  );

  const resetViewOptions = useCallback(() => {
    selectionChange();
    setDirection("all");
    setFilter("all");
    setDateRange({});
    resetSort();
    router.setParams({
      focusDate: "",
      focusType: "",
      direction: "",
      filter: "",
    });
  }, [resetSort]);

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
  const hasCustomSort =
    sort.criterion !== DEFAULT_DEBT_SORT.criterion ||
    sort.direction !== DEFAULT_DEBT_SORT.direction;
  const hasViewChanges = hasActiveFilters || hasCustomSort;
  const datePickerValue =
    datePickerTarget === "to"
      ? (dateRange.to ?? dateRange.from ?? todayIso)
      : (dateRange.from ?? dateRange.to ?? todayIso);
  const focusBannerText = useMemo(() => {
    if (!focus) {
      return "";
    }

    const count = visibleDebts.length;

    if (focus.kind === "paid-this-month") {
      return `${count} settled this month`;
    }

    if (focus.kind === "attention") {
      return `${count} ${count === 1 ? "debt needs" : "debts need"} attention`;
    }

    if (focus.kind === "filter") {
      if (focus.filter === "active") {
        return `${count} active ${count === 1 ? "debt" : "debts"}`;
      }

      if (focus.filter === "overdue") {
        return `${count} overdue`;
      }

      return `${count} due soon`;
    }

    if (focus.kind === "direction") {
      return focus.direction === "they_owe_me" ? `${count} owed to you` : `${count} you owe`;
    }

    return focus.type === "overdue"
      ? `${count} overdue from ${formatDueDate(focus.date)}`
      : `${count} due on ${formatDueDate(focus.date)}`;
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
                : "Add a debt to remember money between you and someone else."}
        </Text>
      </View>
    ),
    [direction, isSearching, theme.colors.mutedLight],
  );

  if (isPending || !isSortHydrated) {
    return (
      <TabScreen>
        <LoadingSpinner />
      </TabScreen>
    );
  }

  return (
    <>
      <TabScreen testID="debts-screen-ready">
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
                <IconButton
                  accessibilityLabel={`View options${hasViewChanges ? ", custom view active" : ""}`}
                  onPress={toggleFilters}
                >
                  <SlidersHorizontal
                    color={hasViewChanges || filtersOpen ? theme.colors.primary : theme.colors.text}
                    size={17}
                    strokeWidth={2}
                  />
                </IconButton>
                <IconButton accessibilityLabel="Search debts" onPress={openSearch}>
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
            <PressableScale hitSlop={8} onPress={dismissFocusBanner} style={styles.focusClear}>
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
          showDirectionCue={deferredDirection === "all"}
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
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          <DebtsFiltersSheetContent
            canUseLiquidGlass={canUseLiquidGlass}
            dateRange={dateRange}
            direction={direction}
            directionTabs={directionTabs}
            filter={filter}
            hasViewChanges={hasViewChanges}
            onClearRangeDate={clearRangeDate}
            onOpenDatePicker={openDatePicker}
            onResetView={resetViewOptions}
            onSelectDirection={selectDirection}
            onSelectFilter={selectFilter}
            onSelectSortCriterion={selectSortCriterion}
            onSelectSortDirection={selectSortDirection}
            sortCriterion={sort.criterion}
            sortDirection={sort.direction}
            sortDirections={sortDirections}
            tabs={tabs}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>

      <DueDatePickerModal
        onClose={() => setDatePickerTarget(null)}
        onSave={saveRangeDate}
        value={datePickerValue}
        visible={datePickerTarget !== null}
      />
    </>
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
    paddingHorizontal: 24,
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
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  emptyCopy: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 240,
  },
}));
