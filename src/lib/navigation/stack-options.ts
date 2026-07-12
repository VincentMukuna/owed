import type { NativeStackNavigationOptions } from "expo-router";

import { modalCloseHeaderLeft } from "@/components/navigation/header-close-button";
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

/** Avoid flashing route paths like `debt/[id]` while detail data loads. */
export const LOADING_DETAIL_HEADER_OPTIONS: NativeStackNavigationOptions = {
  title: "",
};

export function getModalScreenOptions(theme: AppTheme): NativeStackNavigationOptions {
  return {
    ...getStackScreenOptions(theme),
    headerLargeTitleEnabled: false,
    headerBackVisible: false,
    headerLeft: modalCloseHeaderLeft,
  };
}

export const STACK_SCREEN_OPTIONS = getStackScreenOptions(lightTheme);

export const MODAL_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...STACK_SCREEN_OPTIONS,
  headerLargeTitleEnabled: false,
  headerBackVisible: false,
  headerLeft: modalCloseHeaderLeft,
};
