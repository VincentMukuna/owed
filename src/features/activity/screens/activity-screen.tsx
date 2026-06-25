import { StyleSheet, Text, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityList } from "@/components/activity/activity-list";
import { useActivities } from "@/features/debts/hooks/use-activities";
import { APP_BACKGROUND } from "@/lib/navigation/stack-options";

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { data: activities = [], isPending } = useActivities();

  if (isPending) {
    return null;
  }

  return (
    <View style={styles.screen}>
      {activities.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No activity yet.</Text>
        </View>
      ) : (
        <ActivityList
          activities={activities}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#8A8A82",
  },
});
