import { Tabs } from "expo-router";

import { OwedTabBar, type TabBarProps } from "@/components/navigation/owed-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#F7F5F1" },
      }}
      tabBar={(props) => (
        <OwedTabBar
          navigation={props.navigation as TabBarProps["navigation"]}
          state={props.state}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="debts" options={{ title: "Debts" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
