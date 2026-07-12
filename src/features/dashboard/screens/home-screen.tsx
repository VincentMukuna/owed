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
import {
  LIST_LEADING_INSET_ICON_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";
import { PressableScale } from "@/components/shared/pressable-scale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { HOME_RECENT_ACTIVITY_LIMIT } from "@/features/activity/constants";
import { useRecentActivities } from "@/features/activity/hooks/use-recent-activities";
import { HomeDebtSection } from "@/features/dashboard/components/home-debt-section";
import type { DebtAction } from "@/features/debts/components/debt-actions-menu";
import { useArchiveDebt } from "@/features/debts/hooks/use-archive-debt";
import { useDebts } from "@/features/debts/hooks/use-debts";
import { usePaidThisMonth } from "@/features/debts/hooks/use-paid-this-month";
import { confirmArchiveDebt } from "@/features/debts/lib/archive-confirmation";
import { type DebtFilterKey, bucketHomeDebts } from "@/features/debts/lib/debt-list-utils";
import type { DebtCardView } from "@/features/debts/view-models";
import { BellBadgeButton } from "@/features/reminders/components/bell-badge-button";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { invalidateHomeQueries } from "@/lib/query/invalidate-queries";
import { formatCurrency } from "@/lib/utils/formatters";

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
  const archiveDebt = useArchiveDebt();
  const { data: debts = [], isPending } = useDebts();
  const { data: paidThisMonth = 0 } = usePaidThisMonth();
  const { data: recentActivity = [] } = useRecentActivities(HOME_RECENT_ACTIVITY_LIMIT);

  const handleRefresh = useCallback(() => invalidateHomeQueries(queryClient), [queryClient]);
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  const buckets = useMemo(() => bucketHomeDebts(debts), [debts]);
  const sections = useMemo(() => buildHomeSections(buckets, theme.colors.danger), [buckets, theme]);

  const openDebt = useCallback((debtId: string) => {
    router.push(`/debt/${debtId}`);
  }, []);

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
    if (filter === "paid-this-month") {
      router.push({
        pathname: "/debts",
        params: { filter: "all", direction: "all", focusDate: "", focusType: "paid-this-month" },
      });
      return;
    }

    router.push({
      pathname: "/debts",
      params: { filter, direction: "all", focusDate: "", focusType: "" },
    });
  }, []);

  const openDebtsDirection = useCallback((direction: "they_owe_me" | "i_owe_them") => {
    router.push({
      pathname: "/debts",
      params: { direction, filter: "all", focusDate: "", focusType: "" },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: HomeSectionRow }) => (
      <HomeDebtSection
        debts={item.debts}
        filter={item.filter}
        onDebtAction={handleDebtAction}
        onDebtPress={openDebt}
        onTitlePress={openDebtsFilter}
        showDirectionCue
        title={item.title}
        titleColor={item.titleColor}
      />
    ),
    [handleDebtAction, openDebt, openDebtsFilter],
  );

  const keyExtractor = useCallback((item: HomeSectionRow) => item.key, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.heroCard}>
          <View style={[styles.heroOrb, styles.heroOrbTop]} />
          <View style={[styles.heroOrb, styles.heroOrbBottom]} />
          <View style={styles.directionTotals}>
            <PressableScale
              onPress={() => openDebtsDirection("they_owe_me")}
              style={styles.directionTotal}
            >
              <Text style={styles.directionLabel}>Owed to you</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.directionAmount}>
                {formatCurrency(buckets.owedToYou)}
              </Text>
            </PressableScale>
            <View style={styles.directionDivider} />
            <PressableScale
              onPress={() => openDebtsDirection("i_owe_them")}
              style={styles.directionTotal}
            >
              <Text style={styles.directionLabel}>You owe</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.directionAmount}>
                {formatCurrency(buckets.youOwe)}
              </Text>
            </PressableScale>
          </View>
          <Text style={styles.heroMeta}>
            Across {buckets.activeCount} active {buckets.activeCount === 1 ? "promise" : "promises"}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Active promises"
              onPress={() => openDebtsFilter("active")}
              value={String(buckets.activeCount)}
              color={theme.colors.status.active.dot}
            />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Overdue"
              onPress={() => openDebtsFilter("overdue")}
              value={String(buckets.overdue.length)}
              color={theme.colors.danger}
            />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Due soon"
              onPress={() => openDebtsFilter("due-soon")}
              value={String(buckets.dueSoon.length)}
              color={theme.colors.warning}
            />
          </View>
          <View style={styles.statCell}>
            <SummaryStatCard
              label="Settled this month"
              onPress={() => openDebtsFilter("paid-this-month")}
              value={formatCurrency(paidThisMonth)}
              color={theme.colors.success}
            />
          </View>
        </View>
      </View>
    ),
    [buckets, openDebtsDirection, openDebtsFilter, paidThisMonth, theme],
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
          {recentActivity.map((activity, index) => (
            <ListRowContainer
              key={activity.id}
              leadingInset={LIST_LEADING_INSET_ICON_MD}
              showDivider={index > 0}
            >
              <ActivityRow activity={activity} />
            </ListRowContainer>
          ))}
        </View>
      </View>
    );
  }, [recentActivity, openActivity]);

  if (isPending) {
    return (
      <TabScreen>
        <LoadingSpinner />
      </TabScreen>
    );
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
                Add a promise to remember money between you and someone else.
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
          <Text style={styles.pageTitleLg}>{"Here's what's unsettled"}</Text>
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
  directionTotals: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  directionTotal: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  directionDivider: {
    width: 1,
    backgroundColor: theme.colors.onPrimarySurface,
  },
  directionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.onPrimarySurfaceMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  directionAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primaryForeground,
    lineHeight: 29,
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
