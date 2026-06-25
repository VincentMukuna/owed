import { useCallback, useMemo } from "react";

import { StyleSheet, Text, View } from "react-native";

import { type Href, router } from "expo-router";

import { FlashList } from "@shopify/flash-list";
import { Wallet } from "lucide-react-native";

import { ActivityRow } from "@/components/activity/activity-list";
import { SummaryStatCard } from "@/components/debts/summary-stat-card";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { HomeDebtSection } from "@/features/dashboard/components/home-debt-section";
import { useActivities } from "@/features/debts/hooks/use-activities";
import { useDebts } from "@/features/debts/hooks/use-debts";
import { type DebtFilterKey, bucketHomeDebts } from "@/features/debts/lib/debt-list-utils";
import type { DebtCardView } from "@/features/debts/view-models";
import { BellBadgeButton } from "@/features/reminders/components/bell-badge-button";
import { formatCurrency } from "@/lib/utils/formatters";

const RECENT_ACTIVITY_LIMIT = 5;

type HomeSectionRow = {
  key: string;
  title: string;
  titleColor?: string;
  debts: DebtCardView[];
  filter: DebtFilterKey;
};

function buildHomeSections(buckets: ReturnType<typeof bucketHomeDebts>): HomeSectionRow[] {
  const sections: HomeSectionRow[] = [
    { key: "due-soon", title: "Due soon", debts: buckets.dueSoon, filter: "due-soon" },
    {
      key: "overdue",
      title: "Overdue",
      debts: buckets.overdue,
      titleColor: "#F87171",
      filter: "overdue",
    },
    { key: "active", title: "Active", debts: buckets.activePartial, filter: "active" },
  ];

  return sections.filter((section) => section.debts.length > 0);
}

export function HomeScreen() {
  const { data: debts = [], isPending } = useDebts();
  const { data: activities = [] } = useActivities();

  const buckets = useMemo(() => bucketHomeDebts(debts), [debts]);
  const sections = useMemo(() => buildHomeSections(buckets), [buckets]);
  const recentActivity = useMemo(() => activities.slice(0, RECENT_ACTIVITY_LIMIT), [activities]);

  const openDebt = useCallback((debtId: string) => {
    router.push(`/debt/${debtId}`);
  }, []);

  const openAdd = useCallback(() => {
    router.push("/add-debt");
  }, []);

  const openActivity = useCallback(() => {
    router.push("/activity" as Href);
  }, []);

  const openNotifications = useCallback(() => {
    router.push("/notifications" as Href);
  }, []);

  const openDebtsFilter = useCallback((filter: DebtFilterKey) => {
    router.push({
      pathname: "/debts",
      params: { filter, focusDate: "", focusType: "" },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: HomeSectionRow }) => (
      <HomeDebtSection
        debts={item.debts}
        filter={item.filter}
        onDebtPress={openDebt}
        onTitlePress={openDebtsFilter}
        title={item.title}
        titleColor={item.titleColor}
      />
    ),
    [openDebt, openDebtsFilter],
  );

  const keyExtractor = useCallback((item: HomeSectionRow) => item.key, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.heroCard}>
          <View style={[styles.heroOrb, styles.heroOrbTop]} />
          <View style={[styles.heroOrb, styles.heroOrbBottom]} />
          <Text style={styles.heroLabel}>Total owed to you</Text>
          <Text style={styles.heroAmount}>{formatCurrency(buckets.totalOwed)}</Text>
          <Text style={styles.heroMeta}>
            Across {buckets.activeCount} active {buckets.activeCount === 1 ? "promise" : "promises"}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <SummaryStatCard label="Active" value={String(buckets.activeCount)} color="#94A3B8" />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Overdue"
              value={String(buckets.overdue.length)}
              color="#F87171"
            />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Due soon"
              value={String(buckets.dueSoon.length)}
              color="#F59E0B"
            />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Paid this month"
              value={formatCurrency(buckets.paidThisMonth)}
              color="#10B981"
            />
          </View>
        </View>
      </View>
    ),
    [buckets],
  );

  const listFooter = useMemo(() => {
    if (recentActivity.length === 0) {
      return null;
    }
    return (
      <View style={styles.activitySection}>
        <PressableScale hitSlop={8} onPress={openActivity} style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <Text style={styles.seeAll}>See all</Text>
        </PressableScale>
        <View>
          {recentActivity.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </View>
      </View>
    );
  }, [recentActivity, openActivity]);

  if (isPending) {
    return null;
  }

  if (debts.length === 0) {
    return (
      <TabScreen>
        <View style={styles.emptyBody}>
          <View style={styles.emptyHeader}>
            <View style={styles.emptyHeaderRow}>
              <View>
                <Text style={styles.kicker}>Owed</Text>
                <Text style={styles.pageTitle}>Home</Text>
              </View>
              <BellBadgeButton onPress={openNotifications} />
            </View>
          </View>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <Wallet color="#B8B8B0" size={24} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No money tracked yet.</Text>
            <Text style={styles.emptyCopy}>
              {"Add the first amount someone owes you and we'll help you remember the details."}
            </Text>
          </View>
          <FabButton onPress={openAdd} />
        </View>
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Good morning</Text>
          <Text style={styles.pageTitleLg}>{"Here's what you're owed"}</Text>
        </View>
        <BellBadgeButton onPress={openNotifications} />
      </View>

      <FlashList
        contentContainerStyle={styles.scroll}
        data={sections}
        ItemSeparatorComponent={HomeSectionSeparator}
        keyExtractor={keyExtractor}
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      <FabButton onPress={openAdd} />
    </TabScreen>
  );
}

function HomeSectionSeparator() {
  return <View style={styles.sectionSeparator} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A18",
    marginTop: 4,
  },
  pageTitleLg: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A18",
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: FAB_SCROLL_PADDING,
  },
  listHeader: {
    gap: 20,
    paddingBottom: 20,
  },
  heroCard: {
    backgroundColor: "#1A3A2A",
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroOrb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroOrbTop: {
    width: 144,
    height: 144,
    top: -40,
    right: -40,
  },
  heroOrbBottom: {
    width: 112,
    height: 112,
    bottom: -40,
    left: -40,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 40,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  heroMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCell: {
    width: "48%",
    flexGrow: 1,
  },
  sectionSeparator: {
    height: 20,
  },
  activitySection: {
    marginTop: 24,
    gap: 4,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A3A2A",
  },
  emptyBody: {
    flex: 1,
  },
  emptyHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: FAB_SCROLL_PADDING,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EFEFEC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A18",
  },
  emptyCopy: {
    fontSize: 14,
    color: "#8A8A82",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 220,
  },
});
