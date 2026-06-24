import { useMemo, useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { List } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DebtCard } from "@/components/debts/debt-card";
import { FabButton } from "@/components/shared/fab-button";
import { ScreenContainer } from "@/components/shared/screen-container";
import { useAppStore } from "@/features/debts/store/app-store";
import type { DebtStatus } from "@/features/debts/types";

type FilterKey = "all" | "active" | "overdue" | "paid";

const SORT_ORDER: Record<DebtStatus, number> = {
  overdue: 0,
  "due-soon": 1,
  partial: 2,
  active: 3,
  paid: 4,
};

export function DebtsScreen() {
  const insets = useSafeAreaInsets();
  const debts = useAppStore((s) => s.debts);
  const [filter, setFilter] = useState<FilterKey>("all");

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: "All", count: debts.length },
      {
        key: "active" as const,
        label: "Active",
        count: debts.filter((d) => ["active", "due-soon", "partial"].includes(d.status)).length,
      },
      {
        key: "overdue" as const,
        label: "Overdue",
        count: debts.filter((d) => d.status === "overdue").length,
      },
      {
        key: "paid" as const,
        label: "Paid",
        count: debts.filter((d) => d.status === "paid").length,
      },
    ],
    [debts],
  );

  const filtered = debts.filter((debt) => {
    if (filter === "all") return true;
    if (filter === "active") return ["active", "due-soon", "partial"].includes(debt.status);
    if (filter === "overdue") return debt.status === "overdue";
    if (filter === "paid") return debt.status === "paid";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => SORT_ORDER[a.status] - SORT_ORDER[b.status]);

  return (
    <ScreenContainer padded={false} style={{ paddingTop: insets.top }}>
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
                onPress={() => setFilter(tab.key)}
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

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 112 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <List color="#B8B8B0" size={20} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here</Text>
            <Text style={styles.emptyCopy}>No debts in this category.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sorted.map((debt) => (
              <DebtCard key={debt.id} debt={debt} onPress={() => router.push(`/debt/${debt.id}`)} />
            ))}
          </View>
        )}
      </ScrollView>

      <FabButton onPress={() => router.push("/add-debt")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
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
  },
  list: {
    gap: 10,
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
