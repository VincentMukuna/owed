import type { NativeStackNavigationOptions } from "expo-router";

export const APP_BACKGROUND = "#F7F5F1";
export const HEADER_TINT = "#1A3A2A";

export const STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerTintColor: HEADER_TINT,
  headerStyle: { backgroundColor: APP_BACKGROUND },
  headerLargeStyle: { backgroundColor: APP_BACKGROUND },
  contentStyle: { backgroundColor: APP_BACKGROUND },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
};

export const TAB_STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...STACK_SCREEN_OPTIONS,
  headerLargeTitleEnabled: true,
};

export const MODAL_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...STACK_SCREEN_OPTIONS,
  headerLargeTitleEnabled: false,
};
