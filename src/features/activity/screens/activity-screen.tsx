import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Stack } from "expo-router";

import { useAppStore } from "@/features/debts/store/app-store";
import type { ActivityType } from "@/features/debts/types";
import { APP_BACKGROUND } from "@/lib/navigation/stack-options";

const TYPE_CONFIG: Record<ActivityType, { bg: string; text: string; symbol: string }> = {
  payment: { bg: "#ECFDF5", text: "#059669", symbol: "↓" },
  add: { bg: "#F1F5F9", text: "#64748B", symbol: "+" },
  overdue: { bg: "#FEF2F2", text: "#EF4444", symbol: "!" },
  paid: { bg: "#ECFDF5", text: "#059669", symbol: "✓" },
};

export function ActivityScreen() {
  const activities = useAppStore((s) => s.activities);

  return (
    <>
      <Stack.Title large>Activity</Stack.Title>
      <View collapsable={false} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {activities.map((activity) => {
            const config = TYPE_CONFIG[activity.type];
            return (
              <View key={activity.id} style={styles.row}>
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
          })}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
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
