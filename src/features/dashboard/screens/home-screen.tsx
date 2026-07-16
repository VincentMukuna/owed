import { useCallback, useMemo } from "react";

import { RefreshControl, ScrollView, Text, View } from "react-native";

import { type Href, router } from "expo-router";

import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { SummaryStatCard } from "@/components/debts/summary-stat-card";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { HOME_RECENT_ACTIVITY_LIMIT } from "@/features/activity/constants";
import { useRecentActivities } from "@/features/activity/hooks/use-recent-activities";
import { HomeActivitySection } from "@/features/dashboard/components/home-activity-section";
import { HomeDebtSection } from "@/features/dashboard/components/home-debt-section";
import { HomeInsightsSection } from "@/features/dashboard/components/home-insights-section";
import { HOME_PAGE_PADDING } from "@/features/dashboard/components/home-section";
import { HomeUpcomingSection } from "@/features/dashboard/components/home-upcoming-section";
import type { DebtAction } from "@/features/debts/components/debt-actions-menu";
import { useArchiveDebt } from "@/features/debts/hooks/use-archive-debt";
import { useDebts } from "@/features/debts/hooks/use-debts";
import { usePaidThisMonth } from "@/features/debts/hooks/use-paid-this-month";
import { confirmArchiveDebt } from "@/features/debts/lib/archive-confirmation";
import { type DebtFilterKey, buildHomeBriefing } from "@/features/debts/lib/debt-list-utils";
import type { DebtCardView } from "@/features/debts/view-models";
import { BellBadgeButton } from "@/features/reminders/components/bell-badge-button";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { invalidateHomeQueries } from "@/lib/query/invalidate-queries";
import { formatCurrency } from "@/lib/utils/formatters";

type HomeModuleKey = "attention" | "insights" | "activity";

// The stat queries and navigation stay warm while the upcoming-first layout is evaluated.
const SHOW_HOME_STATS = false;

export function HomeScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const archiveDebt = useArchiveDebt();
  const { data: debts = [], isPending } = useDebts();
  const { data: paidThisMonth = 0 } = usePaidThisMonth();
  const { data: recentActivity = [] } = useRecentActivities(HOME_RECENT_ACTIVITY_LIMIT);

  const handleRefresh = useCallback(() => invalidateHomeQueries(queryClient), [queryClient]);
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  const briefing = useMemo(() => buildHomeBriefing(debts), [debts]);
  const modules = useMemo(() => {
    const visible: HomeModuleKey[] = [];
    if (briefing.attentionDebts.length > 0) visible.push("attention");
    visible.push("insights");
    if (recentActivity.length > 0) visible.push("activity");
    return visible;
  }, [briefing, recentActivity.length]);

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
    router.push({
      pathname: "/debts",
      params: {
        filter: "all",
        direction: "all",
        focusDate: "",
        focusType: filter === "paid-this-month" ? "paid-this-month" : `filter-${filter}`,
      },
    });
  }, []);

  const openDebtsDirection = useCallback((direction: "they_owe_me" | "i_owe_them") => {
    router.push({
      pathname: "/debts",
      params: {
        filter: "all",
        direction: "all",
        focusDate: "",
        focusType: `direction-${direction}`,
      },
    });
  }, []);

  const openAttention = useCallback(() => {
    router.push({
      pathname: "/debts",
      params: {
        filter: "all",
        direction: "all",
        focusDate: "",
        focusType: "attention",
      },
    });
  }, []);

  const openActive = useCallback(() => openDebtsFilter("active"), [openDebtsFilter]);
  const openSettled = useCallback(() => openDebtsFilter("paid-this-month"), [openDebtsFilter]);

  const renderItem = useCallback(
    ({ item }: { item: HomeModuleKey }) => {
      if (item === "attention") {
        return (
          <HomeDebtSection
            debts={briefing.attentionDebts}
            onDebtAction={handleDebtAction}
            onDebtPress={openDebt}
            onSeeAll={openAttention}
            showDirectionCue
          />
        );
      }

      if (item === "insights") {
        return (
          <HomeInsightsSection
            activeCount={briefing.activeCount}
            attentionCount={briefing.attentionCount}
            onActivePress={openActive}
            onAttentionPress={openAttention}
            onDirectionPress={openDebtsDirection}
            onSettledPress={openSettled}
            owedToYou={briefing.owedToYou}
            paidThisMonth={paidThisMonth}
            youOwe={briefing.youOwe}
          />
        );
      }

      return <HomeActivitySection activities={recentActivity} onSeeAll={openActivity} />;
    },
    [
      briefing.attentionDebts,
      briefing.activeCount,
      briefing.attentionCount,
      briefing.owedToYou,
      briefing.youOwe,
      handleDebtAction,
      openActive,
      openActivity,
      openAttention,
      openDebt,
      openDebtsDirection,
      openSettled,
      paidThisMonth,
      recentActivity,
    ],
  );

  const keyExtractor = useCallback((item: HomeModuleKey) => item, []);

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
                {formatCurrency(briefing.owedToYou)}
              </Text>
            </PressableScale>
            <View style={styles.directionDivider} />
            <PressableScale
              onPress={() => openDebtsDirection("i_owe_them")}
              style={styles.directionTotal}
            >
              <Text style={styles.directionLabel}>You owe</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.directionAmount}>
                {formatCurrency(briefing.youOwe)}
              </Text>
            </PressableScale>
          </View>
          <Text style={styles.heroMeta}>
            Across {briefing.activeCount} active {briefing.activeCount === 1 ? "debt" : "debts"}
          </Text>
        </View>

        {briefing.upcoming.count > 0 ? (
          <HomeUpcomingSection
            onDebtAction={handleDebtAction}
            onDebtPress={openDebt}
            summary={briefing.upcoming}
          />
        ) : null}

        {SHOW_HOME_STATS ? (
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <SummaryStatCard
                label="Active debts"
                onPress={() => openDebtsFilter("active")}
                value={String(briefing.activeCount)}
                color={theme.colors.status.active.dot}
              />
            </View>
            <View style={styles.statCell}>
              <SummaryStatCard
                label="Overdue"
                onPress={() => openDebtsFilter("overdue")}
                value={String(briefing.overdueCount)}
                color={theme.colors.danger}
              />
            </View>
            <View style={styles.statCell}>
              <SummaryStatCard
                label="Due soon"
                onPress={() => openDebtsFilter("due-soon")}
                value={String(briefing.dueSoonCount)}
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
        ) : null}
      </View>
    ),
    [
      briefing,
      handleDebtAction,
      openDebt,
      openDebtsDirection,
      openDebtsFilter,
      paidThisMonth,
      theme,
    ],
  );

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
                  <Text style={styles.kicker}>Owwed</Text>
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
                Add a debt to remember money between you and someone else.
              </Text>
            </View>
          </View>
        </ScrollView>
        <FabButton onPress={openAdd} />
      </TabScreen>
    );
  }

  return (
    <TabScreen testID="home-screen-ready">
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Good morning</Text>
          <Text style={styles.pageTitleLg}>{"Here's what's unsettled"}</Text>
        </View>
        <BellBadgeButton onPress={openNotifications} />
      </View>

      <FlashList
        contentContainerStyle={styles.scroll}
        data={modules}
        ItemSeparatorComponent={HomeSectionSeparator}
        keyExtractor={keyExtractor}
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
    paddingHorizontal: HOME_PAGE_PADDING,
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
    color: theme.colors.onPrimarySurfaceMuted,
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
