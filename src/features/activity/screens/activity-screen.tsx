import { Text, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import { ActivityList } from "@/components/activity/activity-list";
import { useActivities } from "@/features/debts/hooks/use-activities";

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

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.muted,
  },
}));
