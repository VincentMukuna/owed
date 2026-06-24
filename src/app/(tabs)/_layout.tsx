import { NativeTabs } from "expo-router/unstable-native-tabs";

const TAB_BACKGROUND = "#F7F5F1";

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={TAB_BACKGROUND}
      iconColor={{ default: "#C0C0B8", selected: "#1A3A2A" }}
      labelStyle={{
        default: { color: "#C0C0B8", fontSize: 10, fontWeight: "700" },
        selected: { color: "#1A3A2A", fontSize: 10, fontWeight: "700" },
      }}
      minimizeBehavior="onScrollDown"
      tabBarRespectsIMEInsets
      tintColor="#1A3A2A"
    >
      <NativeTabs.Trigger contentStyle={{ backgroundColor: TAB_BACKGROUND }} name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "home", selected: "home_filled" }}
          sf={{ default: "house", selected: "house.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={{ backgroundColor: TAB_BACKGROUND }} name="debts">
        <NativeTabs.Trigger.Label>Debts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "list", selected: "list" }}
          sf={{ default: "list.bullet", selected: "list.bullet" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={{ backgroundColor: TAB_BACKGROUND }} name="activity">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "history", selected: "history" }}
          sf={{ default: "clock", selected: "clock.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={{ backgroundColor: TAB_BACKGROUND }} name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "settings", selected: "settings" }}
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
