import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import {
  DEFAULT_APP_LOCK_CONFIG,
  normalizeAppLockConfig,
} from "@/features/app-lock/lib/app-lock-policy";
import type { PersistedAppLockConfig } from "@/features/app-lock/types";
import { getItem, removeItem, setItem } from "@/lib/storage/local-storage";

const APP_LOCK_CONFIG_KEY = "app-lock-config-v1";
const APP_LOCK_PIN_KEY = "owed.app-lock.pin-v1";

type StoredPinVerifier = {
  version: 1;
  salt: string;
  digest: string;
};

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function digestPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

function isStoredPinVerifier(value: unknown): value is StoredPinVerifier {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredPinVerifier>;
  return (
    candidate.version === 1 &&
    typeof candidate.salt === "string" &&
    candidate.salt.length > 0 &&
    typeof candidate.digest === "string" &&
    candidate.digest.length > 0
  );
}

async function loadPinVerifier(): Promise<StoredPinVerifier | null> {
  const raw = await SecureStore.getItemAsync(APP_LOCK_PIN_KEY, secureStoreOptions);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredPinVerifier(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function loadAppLockConfig(): Promise<PersistedAppLockConfig> {
  const stored = await getItem<unknown>(APP_LOCK_CONFIG_KEY);
  return normalizeAppLockConfig(stored);
}

export async function saveAppLockConfig(config: PersistedAppLockConfig): Promise<void> {
  await setItem(APP_LOCK_CONFIG_KEY, config);
}

export async function clearAppLockConfig(): Promise<void> {
  await removeItem(APP_LOCK_CONFIG_KEY);
}

export async function hasStoredAppLockPin(): Promise<boolean> {
  return (await loadPinVerifier()) !== null;
}

export async function saveAppLockPin(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  const verifier: StoredPinVerifier = {
    version: 1,
    salt,
    digest: await digestPin(pin, salt),
  };

  await SecureStore.setItemAsync(APP_LOCK_PIN_KEY, JSON.stringify(verifier), secureStoreOptions);
}

export async function verifyStoredAppLockPin(pin: string): Promise<boolean> {
  const verifier = await loadPinVerifier();
  if (!verifier) {
    return false;
  }

  const candidate = await digestPin(pin, verifier.salt);
  if (candidate.length !== verifier.digest.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate.charCodeAt(index) ^ verifier.digest.charCodeAt(index);
  }

  return difference === 0;
}

export async function deleteStoredAppLockPin(): Promise<void> {
  await SecureStore.deleteItemAsync(APP_LOCK_PIN_KEY, secureStoreOptions);
}

export async function resetAppLockPersistence(): Promise<void> {
  await Promise.all([clearAppLockConfig(), deleteStoredAppLockPin()]);
}

export function createDisabledAppLockConfig(): PersistedAppLockConfig {
  return { ...DEFAULT_APP_LOCK_CONFIG };
}
