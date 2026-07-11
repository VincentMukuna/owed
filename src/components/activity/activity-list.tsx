import { memo, useCallback } from "react";

import { RefreshControl, type RefreshControlProps, Text, View } from "react-native";

import { FlashList } from "@shopify/flash-list";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import {
  LIST_LEADING_INSET_ICON_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";
import type { ActivityView } from "@/features/debts/view-models";

const TYPE_SYMBOL: Record<ActivityView["type"], string> = {
  payment: "↓",
  add: "+",
  paid: "✓",
  update: "•",
};

type ActivityListProps = {
  activities: ActivityView[];
  contentContainerStyle?: object;
  refreshControlProps?: RefreshControlProps;
};

export const ActivityRow = memo(({ activity }: { activity: ActivityView }) => {
  const { theme } = useUnistyles();
  const config = theme.colors.activity[activity.type];

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: config.bg }]}>
        <Text style={[styles.symbol, { color: config.text }]}>{TYPE_SYMBOL[activity.type]}</Text>
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
  ({ activities, contentContainerStyle, refreshControlProps }: ActivityListProps) => {
    const renderItem = useCallback(
      ({ item, index }: { item: ActivityView; index: number }) => (
        <ListRowContainer leadingInset={LIST_LEADING_INSET_ICON_MD} showDivider={index > 0}>
          <ActivityRow activity={item} />
        </ListRowContainer>
      ),
      [],
    );

    const keyExtractor = useCallback((item: ActivityView) => item.id, []);

    return (
      <FlashList
        contentContainerStyle={contentContainerStyle}
        data={activities}
        keyExtractor={keyExtractor}
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
  symbol: {
    fontSize: 14,
    fontWeight: "700",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  text: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  sub: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    marginTop: 2,
    flexShrink: 0,
  },
}));
