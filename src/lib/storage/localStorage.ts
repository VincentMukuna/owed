import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@owed/';

export async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${PREFIX}${key}`);
}

export const storageKeys = {
  debts: 'debts',
  payments: 'payments',
  people: 'people',
  settings: 'settings',
  onboardingComplete: 'onboarding-complete',
} as const;
