import type { NativeStackNavigationOptions } from "expo-router";

import { type AppTheme, lightTheme } from "@/styles/themes";

export function getStackScreenOptions(theme: AppTheme): NativeStackNavigationOptions {
  return {
    headerTintColor: theme.colors.primary,
    headerStyle: { backgroundColor: theme.colors.background },
    headerLargeStyle: { backgroundColor: theme.colors.background },
    headerTitleStyle: { color: theme.colors.text },
    contentStyle: { backgroundColor: theme.colors.background },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal",
  };
}

export function getModalScreenOptions(theme: AppTheme): NativeStackNavigationOptions {
  return {
    ...getStackScreenOptions(theme),
    headerLargeTitleEnabled: false,
  };
}

export const STACK_SCREEN_OPTIONS = getStackScreenOptions(lightTheme);

export const MODAL_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...STACK_SCREEN_OPTIONS,
  headerLargeTitleEnabled: false,
};
