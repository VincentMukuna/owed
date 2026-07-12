import { Platform } from "react-native";

import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useUnistyles } from "react-native-unistyles";

import { selectionChange } from "@/lib/haptics";

export default function TabLayout() {
  const { theme } = useUnistyles();
  const isAndroid = Platform.OS === "android";
  const isLight = theme.name === "light";
  const androidIndicatorColor = isLight ? theme.colors.primarySoft : theme.colors.primary;
  const androidSelectedIconColor = isLight ? theme.colors.tabActive : theme.colors.primaryForeground;
  const androidSelectedLabelColor = isLight
    ? theme.colors.tabActive
    : theme.colors.primaryForeground;
  const androidRippleColor = theme.colors.primarySoft;
  const androidTriggerProps = isAndroid
    ? {
        indicatorColor: androidIndicatorColor,
        rippleColor: androidRippleColor,
      }
    : {};
  const triggerContentStyle = { backgroundColor: theme.colors.background };

  return (
    <NativeTabs
      backgroundColor={theme.colors.background}
      iconColor={
        isAndroid
          ? { default: theme.colors.tabInactive, selected: androidSelectedIconColor }
          : { default: theme.colors.tabInactive, selected: theme.colors.tabActive }
      }
      indicatorColor={isAndroid ? androidIndicatorColor : undefined}
      labelStyle={
        isAndroid
          ? {
              default: { color: theme.colors.tabInactive, fontSize: 10, fontWeight: "700" },
              selected: {
                color: androidSelectedLabelColor,
                fontSize: 10,
                fontWeight: "700",
              },
            }
          : {
              default: { color: theme.colors.tabInactive, fontSize: 10, fontWeight: "700" },
              selected: { color: theme.colors.tabActive, fontSize: 10, fontWeight: "700" },
            }
      }
      labelVisibilityMode="labeled"
      minimizeBehavior="onScrollDown"
      rippleColor={isAndroid ? androidRippleColor : undefined}
      screenListeners={{
        tabPress: (event) => {
          if (!event.data.isPrevented) {
            selectionChange();
          }
        },
      }}
      tabBarRespectsIMEInsets
      tintColor={isAndroid ? androidSelectedIconColor : theme.colors.tint}
    >
      <NativeTabs.Trigger
        {...androidTriggerProps}
        contentStyle={triggerContentStyle}
        name="home"
      >
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "home", selected: "home_filled" }}
          sf={{ default: "house", selected: "house.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        {...androidTriggerProps}
        contentStyle={triggerContentStyle}
        name="debts"
      >
        <NativeTabs.Trigger.Label>Debts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "list", selected: "list" }}
          sf={{ default: "list.bullet", selected: "list.bullet" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        {...androidTriggerProps}
        contentStyle={triggerContentStyle}
        name="people"
      >
        <NativeTabs.Trigger.Label>People</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md={{ default: "group", selected: "group" }}
          sf={{ default: "person.2", selected: "person.2.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        {...androidTriggerProps}
        contentStyle={triggerContentStyle}
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
