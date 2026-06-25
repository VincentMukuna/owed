import { APP_CONFIG } from "@/constants/config";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { getItem, setItem, storageKeys } from "@/lib/storage/local-storage";

export type PersistedSettings = {
  defaultCurrency?: string;
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

export async function hydrateReminderSettings(): Promise<void> {
  const stored = await loadPersistedSettings();
  const store = useSettingsStore.getState();

  store.setDefaultCurrency(stored?.defaultCurrency ?? APP_CONFIG.defaultCurrency);
  store.setDefaultReminderTime(stored?.defaultReminderTime ?? APP_CONFIG.defaultReminderTime);
  store.setOverdueReminderEnabled(stored?.overdueReminderEnabled ?? false);
  store.setNotificationsPermissionAsked(stored?.notificationsPermissionAsked ?? false);
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
