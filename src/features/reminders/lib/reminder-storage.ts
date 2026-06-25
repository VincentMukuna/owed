import { UnistylesRuntime } from "react-native-unistyles";

import { APP_CONFIG } from "@/constants/config";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { getItem, setItem, storageKeys } from "@/lib/storage/local-storage";
import { type AppThemeName, appThemes } from "@/styles/themes";

export type PersistedSettings = {
  defaultCurrency?: string;
  themePreference?: AppThemeName;
  defaultReminderTime?: string;
  overdueReminderEnabled?: boolean;
  notificationsPermissionAsked?: boolean;
};

export async function loadPersistedSettings(): Promise<PersistedSettings | null> {
  return getItem<PersistedSettings>(storageKeys.settings);
}

export async function persistSettings(partial: PersistedSettings): Promise<void> {
  const current = (await loadPersistedSettings()) ?? {};
  await setItem(storageKeys.settings, { ...current, ...partial });
}

function applyThemePreference(themePreference: AppThemeName): void {
  useSettingsStore.getState().setThemePreference(themePreference);
  UnistylesRuntime.setTheme(themePreference);
  UnistylesRuntime.setRootViewBackgroundColor(appThemes[themePreference].colors.background);
}

export async function hydratePersistedSettings(): Promise<void> {
  const stored = await loadPersistedSettings();
  const store = useSettingsStore.getState();
  const themePreference = stored?.themePreference ?? "light";

  store.setDefaultCurrency(stored?.defaultCurrency ?? APP_CONFIG.defaultCurrency);
  applyThemePreference(themePreference);
  store.setDefaultReminderTime(stored?.defaultReminderTime ?? APP_CONFIG.defaultReminderTime);
  store.setOverdueReminderEnabled(stored?.overdueReminderEnabled ?? false);
  store.setNotificationsPermissionAsked(stored?.notificationsPermissionAsked ?? false);
}

export const hydrateReminderSettings = hydratePersistedSettings;

export async function saveThemePreference(themePreference: AppThemeName): Promise<void> {
  applyThemePreference(themePreference);
  await persistSettings({ themePreference });
}

export async function saveDefaultReminderTime(defaultReminderTime: string): Promise<void> {
  useSettingsStore.getState().setDefaultReminderTime(defaultReminderTime);
  await persistSettings({ defaultReminderTime });
}

export async function saveOverdueReminderEnabled(overdueReminderEnabled: boolean): Promise<void> {
  useSettingsStore.getState().setOverdueReminderEnabled(overdueReminderEnabled);
  await persistSettings({ overdueReminderEnabled });
}

export async function saveNotificationsPermissionAsked(
  notificationsPermissionAsked: boolean,
): Promise<void> {
  useSettingsStore.getState().setNotificationsPermissionAsked(notificationsPermissionAsked);
  await persistSettings({ notificationsPermissionAsked });
}

export async function saveDefaultCurrency(defaultCurrency: string): Promise<void> {
  useSettingsStore.getState().setDefaultCurrency(defaultCurrency);
  await persistSettings({ defaultCurrency });
}
