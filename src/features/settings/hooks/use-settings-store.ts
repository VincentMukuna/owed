import { create } from "zustand";

import { APP_CONFIG } from "@/constants/config";
import { type BrandColorThemeId, DEFAULT_BRAND_COLOR_THEME } from "@/styles/brand-themes";
import type { ThemePreference } from "@/styles/themes";

type SettingsState = {
  defaultCurrency: string;
  themePreference: ThemePreference;
  brandColorTheme: BrandColorThemeId;
  defaultReminderTime: string;
  overdueReminderEnabled: boolean;
  notificationsPermissionAsked: boolean;
  onboardingComplete: boolean;
  setDefaultCurrency: (currency: string) => void;
  setThemePreference: (themePreference: ThemePreference) => void;
  setBrandColorTheme: (brandColorTheme: BrandColorThemeId) => void;
  setDefaultReminderTime: (time: string) => void;
  setOverdueReminderEnabled: (enabled: boolean) => void;
  setNotificationsPermissionAsked: (asked: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultCurrency: APP_CONFIG.defaultCurrency,
  themePreference: "auto",
  brandColorTheme: DEFAULT_BRAND_COLOR_THEME,
  defaultReminderTime: APP_CONFIG.defaultReminderTime,
  overdueReminderEnabled: false,
  notificationsPermissionAsked: false,
  onboardingComplete: false,
  setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
  setThemePreference: (themePreference) => set({ themePreference }),
  setBrandColorTheme: (brandColorTheme) => set({ brandColorTheme }),
  setDefaultReminderTime: (defaultReminderTime) => set({ defaultReminderTime }),
  setOverdueReminderEnabled: (overdueReminderEnabled) => set({ overdueReminderEnabled }),
  setNotificationsPermissionAsked: (notificationsPermissionAsked) =>
    set({ notificationsPermissionAsked }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
}));
