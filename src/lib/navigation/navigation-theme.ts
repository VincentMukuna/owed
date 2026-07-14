import type { ComponentProps } from "react";

import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";

import type { AppTheme } from "@/styles/themes";

type NavigationTheme = NonNullable<ComponentProps<typeof ThemeProvider>["value"]>;

/** React Navigation theme so stack cards / transitions use our surface colors, not system white. */
export function getNavigationTheme(theme: AppTheme): NavigationTheme {
  const base = theme.name === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: theme.name === "dark",
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}
