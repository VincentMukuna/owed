import type { Href } from "expo-router";

import type { ThemePreference } from "@/styles/themes";

export const SCREENSHOT_TARGETS = {
  home: "/home",
  debts: "/debts",
  people: "/people",
  reminders: "/notifications",
} as const satisfies Record<string, Href>;

export type ScreenshotTarget = keyof typeof SCREENSHOT_TARGETS;
export type ScreenshotTheme = Extract<ThemePreference, "light" | "dark">;

export type ScreenshotAutomationConfig = {
  target: ScreenshotTarget;
  theme: ScreenshotTheme;
};

type SearchParam = string | string[] | undefined;

function singleParam(value: SearchParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseScreenshotAutomationConfig(params: {
  target?: SearchParam;
  theme?: SearchParam;
}): ScreenshotAutomationConfig | null {
  const target = singleParam(params.target);
  const theme = singleParam(params.theme);

  if (!target || !(target in SCREENSHOT_TARGETS)) {
    return null;
  }
  if (theme !== "light" && theme !== "dark") {
    return null;
  }

  return { target: target as ScreenshotTarget, theme };
}

export function screenshotTargetHref(target: ScreenshotTarget): Href {
  return SCREENSHOT_TARGETS[target];
}
