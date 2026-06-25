import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import type { FlashListRef } from "@shopify/flash-list";
import { List, Search } from "lucide-react-native";

import { DebtList } from "@/components/debts/debt-list";
import { DebtSearchBar, type DebtSearchBarRef } from "@/components/debts/debt-search-bar";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { IconButton } from "@/components/shared/icon-button";
import { useDebts } from "@/features/debts/hooks/use-debts";
import {
  type DebtFilterKey,
  computeDebtTabCounts,
  filterSearchAndSortDebts,
} from "@/features/debts/lib/debt-list-utils";
import type { DebtCardView } from "@/features/debts/view-models";
import { selectionChange } from "@/lib/haptics";

export function DebtsScreen() {
  const { data: debts = [], isPending } = useDebts();
  const [filter, setFilter] = useState<DebtFilterKey>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const listRef = useRef<FlashListRef<DebtCardView>>(null);
  const searchRef = useRef<DebtSearchBarRef>(null);

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
    () => filterSearchAndSortDebts(debts, filter, deferredSearchQuery),
    [debts, filter, deferredSearchQuery],
  );

  useEffect(() => {
    listRef.current?.scrollToTop({ animated: false });
  }, [filter, deferredSearchQuery]);

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
    setSearchOpen(true);
  }, []);

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
                onPress={() => {
                  selectionChange();
                  setFilter(tab.key);
                }}
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
