import { memo, useCallback } from "react";

import { StyleSheet, Text, View } from "react-native";

import { FlashList } from "@shopify/flash-list";

import type { ActivityView } from "@/features/debts/view-models";

const TYPE_CONFIG: Record<ActivityView["type"], { bg: string; text: string; symbol: string }> = {
  payment: { bg: "#ECFDF5", text: "#059669", symbol: "↓" },
  add: { bg: "#F1F5F9", text: "#64748B", symbol: "+" },
  paid: { bg: "#ECFDF5", text: "#059669", symbol: "✓" },
};

type ActivityListProps = {
  activities: ActivityView[];
  contentContainerStyle?: object;
};

export const ActivityRow = memo(({ activity }: { activity: ActivityView }) => {
  const config = TYPE_CONFIG[activity.type];

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: config.bg }]}>
        <Text style={[styles.symbol, { color: config.text }]}>{config.symbol}</Text>
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

export const ActivityList = memo(({ activities, contentContainerStyle }: ActivityListProps) => {
  const renderItem = useCallback(
    ({ item }: { item: ActivityView }) => <ActivityRow activity={item} />,
    [],
  );

  const keyExtractor = useCallback((item: ActivityView) => item.id, []);

  return (
    <FlashList
      contentContainerStyle={contentContainerStyle}
      data={activities}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
    />
  );
});

ActivityList.displayName = "ActivityList";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
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
    color: "#1A1A18",
    lineHeight: 20,
  },
  sub: {
    fontSize: 12,
    color: "#8A8A82",
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: "#B8B8B0",
    marginTop: 2,
    flexShrink: 0,
  },
});
