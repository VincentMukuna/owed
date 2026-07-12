import { memo, useCallback } from "react";

import { RefreshControl, type RefreshControlProps, Text, View } from "react-native";

import { FlashList } from "@shopify/flash-list";
import {
  Archive,
  Banknote,
  Calendar,
  Check,
  type LucideIcon,
  Pencil,
  Plus,
} from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import {
  LIST_LEADING_INSET_ICON_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { ActivityView, ActivityViewType } from "@/features/debts/view-models";
import type { AppTheme } from "@/styles/themes";

const ACTIVITY_ICON: Record<ActivityViewType, LucideIcon> = {
  payment: Banknote,
  add: Plus,
  paid: Check,
  "amount-changed": Pencil,
  "due-date-changed": Calendar,
  archived: Archive,
};

type ActivityColorKey = keyof AppTheme["colors"]["activity"];

function activityColorKey(type: ActivityViewType): ActivityColorKey {
  switch (type) {
    case "amount-changed":
    case "due-date-changed":
      return "update";
    case "archived":
      return "add";
    default:
      return type;
  }
}

type ActivityListProps = {
  activities: ActivityView[];
  contentContainerStyle?: object;
  isFetchingNextPage?: boolean;
  onEndReached?: () => void;
  refreshControlProps?: RefreshControlProps;
};

export const ActivityRow = memo(({ activity }: { activity: ActivityView }) => {
  const { theme } = useUnistyles();
  const config = theme.colors.activity[activityColorKey(activity.type)];
  const Icon = ACTIVITY_ICON[activity.type];

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: config.bg }]}>
        <Icon color={config.text} size={14} strokeWidth={2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.text}>{activity.text}</Text>
        <Text style={styles.sub}>{activity.sub}</Text>
      </View>
      <Text style={styles.time}>{activity.time}</Text>
    </View>
  );
});

ActivityRow.displayName = "ActivityRow";

export const ActivityList = memo(
  ({
    activities,
    contentContainerStyle,
    isFetchingNextPage = false,
    onEndReached,
    refreshControlProps,
  }: ActivityListProps) => {
    const renderItem = useCallback(
      ({ item, index }: { item: ActivityView; index: number }) => (
        <ListRowContainer leadingInset={LIST_LEADING_INSET_ICON_MD} showDivider={index > 0}>
          <ActivityRow activity={item} />
        </ListRowContainer>
      ),
      [],
    );

    const keyExtractor = useCallback((item: ActivityView) => item.id, []);

    const renderFooter = useCallback(() => {
      if (!isFetchingNextPage) {
        return null;
      }

      return (
        <View style={styles.footer}>
          <LoadingSpinner />
        </View>
      );
    }, [isFetchingNextPage]);

    return (
      <FlashList
        contentContainerStyle={contentContainerStyle}
        data={activities}
        keyExtractor={keyExtractor}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          refreshControlProps ? <RefreshControl {...refreshControlProps} /> : undefined
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    );
  },
);

ActivityList.displayName = "ActivityList";

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 20,
  },
  sub: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 17,
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.muted,
    lineHeight: 17,
    marginTop: 2,
    flexShrink: 0,
  },
  footer: {
    paddingVertical: 16,
  },
}));
