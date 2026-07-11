import { View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

import { FAB_SCROLL_PADDING } from "@/components/shared/fab-button";
import {
  LIST_LEADING_INSET_AVATAR_MD,
  LIST_LEADING_INSET_ICON_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";

import { Skeleton } from "./skeleton";

function DebtCardSkeleton() {
  return (
    <View style={styles.debtCard}>
      <Skeleton borderRadius={999} height={40} width={40} />
      <View style={styles.debtCardBody}>
        <Skeleton height={14} width="55%" />
        <Skeleton height={12} style={styles.gapSm} width="40%" />
        <Skeleton height={10} style={styles.gapSm} width="70%" />
      </View>
      <Skeleton height={14} width={56} />
    </View>
  );
}

function ActivityRowSkeleton() {
  return (
    <View style={styles.activityRow}>
      <Skeleton borderRadius={999} height={32} width={32} />
      <View style={styles.activityBody}>
        <Skeleton height={13} width="75%" />
        <Skeleton height={11} style={styles.gapSm} width="45%" />
      </View>
      <Skeleton height={13} width={48} />
    </View>
  );
}

function PersonRowSkeleton() {
  return (
    <View style={styles.personRow}>
      <Skeleton borderRadius={999} height={44} width={44} />
      <View style={styles.personBody}>
        <Skeleton height={15} width="50%" />
        <Skeleton height={12} style={styles.gapSm} width="35%" />
      </View>
      <Skeleton height={14} width={64} />
    </View>
  );
}

function NotificationRowSkeleton() {
  return (
    <View style={styles.notificationRow}>
      <Skeleton borderRadius={12} height={40} width={40} />
      <View style={styles.notificationBody}>
        <Skeleton height={14} width="80%" />
        <Skeleton height={11} style={styles.gapSm} width="55%" />
      </View>
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={styles.home}>
      <View style={styles.homeHeader}>
        <View>
          <Skeleton height={10} width={72} />
          <Skeleton height={20} style={styles.gapSm} width={180} />
        </View>
        <Skeleton borderRadius={999} height={36} width={36} />
      </View>

      <View style={styles.heroCard}>
        <Skeleton height={10} width={100} />
        <Skeleton height={38} style={styles.gapMd} width="65%" />
        <Skeleton height={12} style={styles.gapSm} width="45%" />
      </View>

      <View style={styles.statsGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <View key={index} style={styles.statCell}>
            <Skeleton borderRadius={12} height={72} />
          </View>
        ))}
      </View>

      <Skeleton height={10} style={styles.sectionLabel} width={64} />
      <ListRowContainer leadingInset={LIST_LEADING_INSET_AVATAR_MD} showDivider={false}>
        <DebtCardSkeleton />
      </ListRowContainer>
      <ListRowContainer leadingInset={LIST_LEADING_INSET_AVATAR_MD} showDivider>
        <DebtCardSkeleton />
      </ListRowContainer>
      <ListRowContainer leadingInset={LIST_LEADING_INSET_AVATAR_MD} showDivider>
        <DebtCardSkeleton />
      </ListRowContainer>
    </View>
  );
}

type TabListSkeletonProps = {
  showFilterTabs?: boolean;
  showSummary?: boolean;
  row?: "debt" | "person";
  rowCount?: number;
};

export function TabListScreenSkeleton({
  showFilterTabs = false,
  showSummary = false,
  row = "debt",
  rowCount = 6,
}: TabListSkeletonProps) {
  const Row = row === "person" ? PersonRowSkeleton : DebtCardSkeleton;

  return (
    <View style={styles.tabList}>
      <View style={styles.tabHeader}>
        <Skeleton height={28} width={96} />
        <Skeleton borderRadius={999} height={32} width={32} />
      </View>

      {showSummary ? (
        <View style={styles.summaryCard}>
          <Skeleton height={10} width={72} />
          <Skeleton height={24} style={styles.gapSm} width="40%" />
        </View>
      ) : null}

      {showFilterTabs ? (
        <View style={styles.filterRow}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} borderRadius={999} height={32} width={72} />
          ))}
        </View>
      ) : null}

      {Array.from({ length: rowCount }, (_, index) => (
        <ListRowContainer
          key={index}
          leadingInset={LIST_LEADING_INSET_AVATAR_MD}
          showDivider={index > 0}
        >
          <Row />
        </ListRowContainer>
      ))}
    </View>
  );
}

export function ActivityListScreenSkeleton() {
  return (
    <View style={styles.activityList}>
      {Array.from({ length: 8 }, (_, index) => (
        <ListRowContainer
          key={index}
          leadingInset={LIST_LEADING_INSET_ICON_MD}
          showDivider={index > 0}
        >
          <ActivityRowSkeleton />
        </ListRowContainer>
      ))}
    </View>
  );
}

export function DetailScreenSkeleton() {
  return (
    <View style={styles.detail}>
      <View style={styles.detailHero}>
        <Skeleton borderRadius={999} height={56} width={56} />
        <Skeleton height={22} style={styles.gapMd} width="55%" />
        <Skeleton height={34} style={styles.gapSm} width="40%" />
        <Skeleton height={12} style={styles.gapSm} width="30%" />
      </View>

      <Skeleton height={10} style={styles.sectionLabel} width={80} />
      <ListRowContainer leadingInset={LIST_LEADING_INSET_AVATAR_MD} showDivider={false}>
        <DebtCardSkeleton />
      </ListRowContainer>
      <ListRowContainer leadingInset={LIST_LEADING_INSET_AVATAR_MD} showDivider>
        <DebtCardSkeleton />
      </ListRowContainer>

      <Skeleton height={10} width={96} />
      <ListRowContainer leadingInset={LIST_LEADING_INSET_ICON_MD} showDivider={false}>
        <ActivityRowSkeleton />
      </ListRowContainer>
      <ListRowContainer leadingInset={LIST_LEADING_INSET_ICON_MD} showDivider>
        <ActivityRowSkeleton />
      </ListRowContainer>
    </View>
  );
}

export function FormScreenSkeleton() {
  return (
    <View style={styles.form}>
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.field}>
          <Skeleton height={10} width={56} />
          <Skeleton borderRadius={12} height={48} style={styles.gapSm} />
        </View>
      ))}
    </View>
  );
}

export function NotificationsScreenSkeleton() {
  return (
    <View style={styles.notifications}>
      {Array.from({ length: 5 }, (_, index) => (
        <ListRowContainer
          key={index}
          leadingInset={LIST_LEADING_INSET_ICON_MD}
          showDivider={index > 0}
        >
          <NotificationRowSkeleton />
        </ListRowContainer>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  home: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: FAB_SCROLL_PADDING,
  },
  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 16,
  },
  heroCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCell: {
    width: "48%",
    flexGrow: 1,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  gapSm: {
    marginTop: 8,
  },
  gapMd: {
    marginTop: 12,
  },
  gapLg: {
    marginTop: 24,
  },
  debtCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
  },
  debtCardBody: {
    flex: 1,
    minWidth: 0,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  activityBody: {
    flex: 1,
    minWidth: 0,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
  },
  personBody: {
    flex: 1,
    minWidth: 0,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  notificationBody: {
    flex: 1,
    minWidth: 0,
  },
  tabList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: FAB_SCROLL_PADDING,
  },
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 16,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  rowGap: {
    marginBottom: 8,
  },
  activityList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  detail: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  detailHero: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  field: {
    gap: 0,
  },
  notifications: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
}));
