import { create } from 'zustand';

import { APP_CONFIG } from '@/constants/config';

type SettingsState = {
  defaultCurrency: string;
  defaultReminderTime: string;
  onboardingComplete: boolean;
  setDefaultCurrency: (currency: string) => void;
  setDefaultReminderTime: (time: string) => void;
  setOnboardingComplete: (complete: boolean) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultCurrency: APP_CONFIG.defaultCurrency,
  defaultReminderTime: APP_CONFIG.defaultReminderTime,
  onboardingComplete: false,
  setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
  setDefaultReminderTime: (defaultReminderTime) => set({ defaultReminderTime }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
}));
