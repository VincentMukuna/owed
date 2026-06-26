import { useCallback, useMemo } from "react";

import { RefreshControl, ScrollView, Text, View } from "react-native";

import { type Href, router } from "expo-router";

import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ActivityRow } from "@/components/activity/activity-list";
import { SummaryStatCard } from "@/components/debts/summary-stat-card";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { useActivities } from "@/features/activity/hooks/use-activities";
import { HomeDebtSection } from "@/features/dashboard/components/home-debt-section";
import { useDebts } from "@/features/debts/hooks/use-debts";
import { type DebtFilterKey, bucketHomeDebts } from "@/features/debts/lib/debt-list-utils";
import type { DebtCardView } from "@/features/debts/view-models";
import { BellBadgeButton } from "@/features/reminders/components/bell-badge-button";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { invalidateHomeQueries } from "@/lib/query/invalidate-queries";
import { formatCurrency } from "@/lib/utils/formatters";

const RECENT_ACTIVITY_LIMIT = 5;

type HomeSectionRow = {
  key: string;
  title: string;
  titleColor?: string;
  debts: DebtCardView[];
  filter: DebtFilterKey;
};

function buildHomeSections(
  buckets: ReturnType<typeof bucketHomeDebts>,
  dangerColor: string,
): HomeSectionRow[] {
  const sections: HomeSectionRow[] = [
    { key: "due-soon", title: "Due soon", debts: buckets.dueSoon, filter: "due-soon" },
    {
      key: "overdue",
      title: "Overdue",
      debts: buckets.overdue,
      titleColor: dangerColor,
      filter: "overdue",
    },
    { key: "active", title: "Active", debts: buckets.activePartial, filter: "active" },
  ];

  return sections.filter((section) => section.debts.length > 0);
}

export function HomeScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const { data: debts = [], isPending } = useDebts();
  const { data: activities = [] } = useActivities();

  const handleRefresh = useCallback(() => invalidateHomeQueries(queryClient), [queryClient]);
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  const buckets = useMemo(() => bucketHomeDebts(debts), [debts]);
  const sections = useMemo(() => buildHomeSections(buckets, theme.colors.danger), [buckets, theme]);
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
            <SummaryStatCard
              label="Active"
              value={String(buckets.activeCount)}
              color={theme.colors.status.active.dot}
            />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Overdue"
              value={String(buckets.overdue.length)}
              color={theme.colors.danger}
            />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Due soon"
              value={String(buckets.dueSoon.length)}
              color={theme.colors.warning}
            />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Paid this month"
              value={formatCurrency(buckets.paidThisMonth)}
              color={theme.colors.success}
            />
          </View>
        </View>
      </View>
    ),
    [buckets, theme],
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
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={<RefreshControl {...refreshControlProps} />}
          showsVerticalScrollIndicator={false}
        >
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
                <Wallet color={theme.colors.mutedLight} size={24} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No money tracked yet.</Text>
              <Text style={styles.emptyCopy}>
                {"Add the first amount someone owes you and we'll help you remember the details."}
              </Text>
            </View>
          </View>
        </ScrollView>
        <FabButton onPress={openAdd} />
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
        refreshControl={<RefreshControl {...refreshControlProps} />}
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

const styles = StyleSheet.create((theme) => ({
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
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 4,
  },
  pageTitleLg: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
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
    backgroundColor: theme.colors.hero,
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroOrb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: theme.colors.onPrimarySurface,
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
    color: theme.colors.onPrimarySurfaceMuted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: "700",
    color: theme.colors.primaryForeground,
    lineHeight: 40,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  heroMeta: {
    fontSize: 12,
    color: theme.colors.onPrimarySurfaceSubtle,
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
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  emptyBody: {
    flexGrow: 1,
  },
  emptyScroll: {
    flexGrow: 1,
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
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  emptyCopy: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 220,
  },
}));
