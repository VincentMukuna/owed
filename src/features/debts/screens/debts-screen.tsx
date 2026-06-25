import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import type { FlashListRef } from "@shopify/flash-list";
import { List } from "lucide-react-native";

import { DebtList } from "@/components/debts/debt-list";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { useDebts } from "@/features/debts/hooks/use-debts";
import {
  type DebtFilterKey,
  computeDebtTabCounts,
  filterDebts,
  sortDebts,
} from "@/features/debts/lib/debt-list-utils";
import type { DebtCardView } from "@/features/debts/view-models";
import { selectionChange } from "@/lib/haptics";

export function DebtsScreen() {
  const { data: debts = [], isPending } = useDebts();
  const [filter, setFilter] = useState<DebtFilterKey>("all");
  const listRef = useRef<FlashListRef<DebtCardView>>(null);

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

  const visibleDebts = useMemo(() => sortDebts(filterDebts(debts, filter)), [debts, filter]);

  useEffect(() => {
    listRef.current?.scrollToTop({ animated: false });
  }, [filter]);

  const openDebt = useCallback((debtId: string) => {
    router.push(`/debt/${debtId}`);
  }, []);

  const openAdd = useCallback(() => {
    router.push("/add-debt");
  }, []);

  const emptyState = useMemo(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <List color="#B8B8B0" size={20} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>Nothing here</Text>
        <Text style={styles.emptyCopy}>No debts in this category.</Text>
      </View>
    ),
    [],
  );

  if (isPending) {
    return null;
  }

  return (
    <TabScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Debts</Text>
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
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A18",
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
