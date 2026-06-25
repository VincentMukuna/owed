import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import type { FlashListRef } from "@shopify/flash-list";
import { List, Search, X } from "lucide-react-native";

import { DebtList } from "@/components/debts/debt-list";
import { DebtSearchBar, type DebtSearchBarRef } from "@/components/debts/debt-search-bar";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { IconButton } from "@/components/shared/icon-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { useDebts } from "@/features/debts/hooks/use-debts";
import {
  type DebtFilterKey,
  computeDebtTabCounts,
  filterDebtsByDueDate,
  filterSearchAndSortDebts,
} from "@/features/debts/lib/debt-list-utils";
import { formatDueDate } from "@/features/debts/lib/format-dates";
import type { DebtCardView } from "@/features/debts/view-models";
import { selectionChange } from "@/lib/haptics";
import type { ReminderType } from "@/types";

type ReminderFocus = { date: string; type: ReminderType };

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

export function DebtsScreen() {
  const { data: debts = [], isPending } = useDebts();
  const params = useLocalSearchParams<{
    focusDate?: string;
    focusType?: string;
    filter?: string;
  }>();
  const paramFilter = useMemo(() => parseFilterParam(params.filter), [params.filter]);
  const [userFilter, setUserFilter] = useState<DebtFilterKey>("all");
  const filter = paramFilter ?? userFilter;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const listRef = useRef<FlashListRef<DebtCardView>>(null);
  const searchRef = useRef<DebtSearchBarRef>(null);

  const focus = useMemo<ReminderFocus | null>(() => {
    const focusDate = params.focusDate;
    if (typeof focusDate !== "string" || focusDate.length === 0) {
      return null;
    }
    return { date: focusDate, type: params.focusType === "overdue" ? "overdue" : "due" };
  }, [params.focusDate, params.focusType]);

  const clearFocus = useCallback(() => {
    router.setParams({ focusDate: "", focusType: "" });
  }, []);

  const tabCounts = useMemo(() => computeDebtTabCounts(debts), [debts]);

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: "All", count: tabCounts.all },
      { key: "active" as const, label: "Active", count: tabCounts.active },
      { key: "overdue" as const, label: "Overdue", count: tabCounts.overdue },
      { key: "paid" as const, label: "Paid", count: tabCounts.paid },
    ],
    [tabCounts],
  );

  const visibleDebts = useMemo(
    () =>
      focus
        ? filterDebtsByDueDate(debts, focus.date)
        : filterSearchAndSortDebts(debts, filter, deferredSearchQuery),
    [debts, filter, deferredSearchQuery, focus],
  );

  useEffect(() => {
    listRef.current?.scrollToTop({ animated: false });
  }, [filter, deferredSearchQuery, focus]);

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

  const selectFilter = useCallback(
    (key: DebtFilterKey) => {
      selectionChange();
      clearFocus();
      setUserFilter(key);
      router.setParams({ filter: "" });
    },
    [clearFocus],
  );

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

  const isSearching = searchQuery.trim().length > 0;

  const emptyState = useMemo(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          {isSearching ? (
            <Search color="#B8B8B0" size={20} strokeWidth={1.5} />
          ) : (
            <List color="#B8B8B0" size={20} strokeWidth={1.5} />
          )}
        </View>
        <Text style={styles.emptyTitle}>{isSearching ? "No matches" : "Nothing here"}</Text>
        <Text style={styles.emptyCopy}>
          {isSearching ? "Try a different name or reason." : "No debts in this category."}
        </Text>
      </View>
    ),
    [isSearching],
  );

  if (isPending) {
    return null;
  }

  return (
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
            <IconButton onPress={openSearch}>
              <Search color="#4A4A42" size={16} strokeWidth={1.5} />
            </IconButton>
          </>
        )}
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => selectFilter(tab.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                  {tab.count > 0 && !active ? (
                    <Text style={styles.tabCount}> {tab.count}</Text>
                  ) : null}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {focus ? (
        <View style={styles.focusBanner}>
          <Text style={styles.focusText} numberOfLines={1}>
            {focus.type === "overdue"
              ? `${visibleDebts.length} overdue from ${formatDueDate(focus.date)}`
              : `${visibleDebts.length} promised on ${formatDueDate(focus.date)}`}
          </Text>
          <PressableScale hitSlop={8} onPress={clearFocus} style={styles.focusClear}>
            <Text style={styles.focusClearText}>Clear</Text>
            <X color="#4A4A42" size={14} strokeWidth={2} />
          </PressableScale>
        </View>
      ) : null}

      <DebtList
        ref={listRef}
        contentContainerStyle={styles.scroll}
        debts={visibleDebts}
        ListEmptyComponent={emptyState}
        onDebtPress={openDebt}
      />

      <FabButton onPress={openAdd} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
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
    color: "#1A1A18",
  },
  cancel: {
    flexShrink: 0,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A42",
  },
  tabsWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  focusBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#EFEFEC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  focusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#4A4A42",
  },
  focusClear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  focusClearText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A4A42",
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#EFEFEC",
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A82",
  },
  tabTextActive: {
    color: "#1A1A18",
  },
  tabCount: {
    fontSize: 10,
    opacity: 0.7,
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
    backgroundColor: "#EFEFEC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A42",
  },
  emptyCopy: {
    fontSize: 12,
    color: "#B8B8B0",
    marginTop: 4,
  },
});
