import type { Href } from "expo-router";

import type { ThemePreference } from "@/styles/themes";

export const SCREENSHOT_TARGETS = {
  home: "/home",
  debts: "/debts",
  people: "/people",
  reminders: "/notifications",
  activity: "/activity",
  settings: "/settings?screenshotMode=store",
} as const satisfies Record<string, Href>;

export type ScreenshotTarget = keyof typeof SCREENSHOT_TARGETS | "debt-detail" | "person-detail";
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

  if (
    !target ||
    (!(target in SCREENSHOT_TARGETS) && target !== "debt-detail" && target !== "person-detail")
  ) {
    return null;
  }
  if (theme !== "light" && theme !== "dark") {
    return null;
  }

  return { target: target as ScreenshotTarget, theme };
}

export function screenshotTargetHref(target: ScreenshotTarget): Href {
  if (target === "debt-detail" || target === "person-detail") {
    throw new Error(`${target} must be resolved from the seeded screenshot fixture.`);
  }
  return SCREENSHOT_TARGETS[target];
}
