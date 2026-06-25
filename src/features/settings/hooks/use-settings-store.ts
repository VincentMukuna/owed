import { create } from "zustand";

import { APP_CONFIG } from "@/constants/config";

type SettingsState = {
  defaultCurrency: string;
  defaultReminderTime: string;
  overdueReminderEnabled: boolean;
  notificationsPermissionAsked: boolean;
  onboardingComplete: boolean;
  setDefaultCurrency: (currency: string) => void;
  setDefaultReminderTime: (time: string) => void;
  setOverdueReminderEnabled: (enabled: boolean) => void;
  setNotificationsPermissionAsked: (asked: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultCurrency: APP_CONFIG.defaultCurrency,
  defaultReminderTime: APP_CONFIG.defaultReminderTime,
  overdueReminderEnabled: false,
  notificationsPermissionAsked: false,
  onboardingComplete: false,
  setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
  setDefaultReminderTime: (defaultReminderTime) => set({ defaultReminderTime }),
  setOverdueReminderEnabled: (overdueReminderEnabled) => set({ overdueReminderEnabled }),
  setNotificationsPermissionAsked: (notificationsPermissionAsked) =>
    set({ notificationsPermissionAsked }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
}));
