import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useUnistyles } from "react-native-unistyles";

import { selectionChange } from "@/lib/haptics";

export default function TabLayout() {
  const { theme } = useUnistyles();

  return (
    <NativeTabs
      backgroundColor={theme.colors.background}
      iconColor={{ default: theme.colors.tabInactive, selected: theme.colors.tabActive }}
      labelStyle={{
        default: { color: theme.colors.tabInactive, fontSize: 10, fontWeight: "700" },
        selected: { color: theme.colors.tabActive, fontSize: 10, fontWeight: "700" },
      }}
      minimizeBehavior="onScrollDown"
      screenListeners={{
        tabPress: (event) => {
          if (!event.data.isPrevented) {
            selectionChange();
          }
        },
      }}
      tabBarRespectsIMEInsets
      tintColor={theme.colors.tint}
    >
      <NativeTabs.Trigger contentStyle={{ backgroundColor: theme.colors.background }} name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "home", selected: "home_filled" }}
          sf={{ default: "house", selected: "house.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={{ backgroundColor: theme.colors.background }} name="debts">
        <NativeTabs.Trigger.Label>Debts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "list", selected: "list" }}
          sf={{ default: "list.bullet", selected: "list.bullet" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={{ backgroundColor: theme.colors.background }} name="people">
        <NativeTabs.Trigger.Label>People</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "group", selected: "group" }}
          sf={{ default: "person.2", selected: "person.2.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        contentStyle={{ backgroundColor: theme.colors.background }}
        name="settings"
      >
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "settings", selected: "settings" }}
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
