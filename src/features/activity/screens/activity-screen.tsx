import { StyleSheet, Text, View } from "react-native";

import { ActivityList } from "@/components/activity/activity-list";
import { TabScreen } from "@/components/navigation/tab-screen";
import { useActivities } from "@/features/debts/hooks/use-activities";

export function ActivityScreen() {
  const { data: activities = [], isPending } = useActivities();

  if (isPending) {
    return null;
  }

  return (
    <TabScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <ActivityList activities={activities} contentContainerStyle={styles.scroll} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A18",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
