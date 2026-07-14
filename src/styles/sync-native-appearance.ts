import { Appearance } from "react-native";

import * as SystemUI from "expo-system-ui";
import { UnistylesRuntime } from "react-native-unistyles";

import { type AppThemeName, type ThemePreference, appThemes } from "./themes";

function resolveCurrentThemeName(): AppThemeName {
  return UnistylesRuntime.themeName === "dark" ? "dark" : "light";
}

/** Keep UIKit / window chrome in sync with the in-app theme (stack slide underlayer). */
export function syncNativeColorScheme(themePreference: ThemePreference): void {
  Appearance.setColorScheme(themePreference === "auto" ? "unspecified" : themePreference);
}

export function syncNativeBackgroundColor(backgroundColor: string): void {
  UnistylesRuntime.setRootViewBackgroundColor(backgroundColor);
  void SystemUI.setBackgroundColorAsync(backgroundColor);
}

export function applyThemePreferenceToRuntime(themePreference: ThemePreference): void {
  syncNativeColorScheme(themePreference);

  if (themePreference === "auto") {
    UnistylesRuntime.setAdaptiveThemes(true);
    syncNativeBackgroundColor(appThemes[resolveCurrentThemeName()].colors.background);
    return;
  }

  UnistylesRuntime.setAdaptiveThemes(false);
  UnistylesRuntime.setTheme(themePreference);
  syncNativeBackgroundColor(appThemes[themePreference].colors.background);
}
