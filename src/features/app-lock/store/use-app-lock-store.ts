import { create } from "zustand";

import {
  DEFAULT_APP_LOCK_CONFIG,
  clearExpiredLockout,
  registerFailedPinAttempt,
} from "@/features/app-lock/lib/app-lock-policy";
import {
  createDisabledAppLockConfig,
  deleteStoredAppLockPin,
  hasStoredAppLockPin,
  loadAppLockConfig,
  saveAppLockConfig,
  saveAppLockPin,
  verifyStoredAppLockPin,
} from "@/features/app-lock/lib/app-lock-storage";
import type { PersistedAppLockConfig, PinAttemptResult } from "@/features/app-lock/types";

type AppLockState = PersistedAppLockConfig & {
  hydrated: boolean;
  lockStatus: "locked" | "unlocked";
  privacyCovered: boolean;
  lockSessionId: number;
  suppressAutoBiometrics: boolean;
  autoPromptedSessionId: number | null;
  pinChangeAuthorizationUntil: number | null;
};

const initialState: AppLockState = {
  ...DEFAULT_APP_LOCK_CONFIG,
  hydrated: false,
  lockStatus: "unlocked",
  privacyCovered: false,
  lockSessionId: 0,
  suppressAutoBiometrics: false,
  autoPromptedSessionId: null,
  pinChangeAuthorizationUntil: null,
};

export const useAppLockStore = create<AppLockState>(() => initialState);

function applyConfig(config: PersistedAppLockConfig): void {
  useAppLockStore.setState({
    enabled: config.enabled,
    biometricsEnabled: config.biometricsEnabled,
    failedAttempts: config.failedAttempts,
    lockoutUntil: config.lockoutUntil,
  });
}

function currentConfig(): PersistedAppLockConfig {
  const state = useAppLockStore.getState();
  return {
    version: 1,
    enabled: state.enabled,
    biometricsEnabled: state.biometricsEnabled,
    failedAttempts: state.failedAttempts,
    lockoutUntil: state.lockoutUntil,
  };
}

async function persistAndApply(config: PersistedAppLockConfig): Promise<void> {
  await saveAppLockConfig(config);
  applyConfig(config);
}

export async function hydrateAppLock(): Promise<void> {
  if (process.env.EXPO_OS === "web") {
    useAppLockStore.setState({ ...initialState, hydrated: true });
    return;
  }

  try {
    let config = clearExpiredLockout(await loadAppLockConfig(), Date.now());
    if (config.enabled && !(await hasStoredAppLockPin())) {
      config = createDisabledAppLockConfig();
      await saveAppLockConfig(config);
    }

    useAppLockStore.setState({
      ...config,
      hydrated: true,
      lockStatus: config.enabled ? "locked" : "unlocked",
      privacyCovered: false,
      lockSessionId: config.enabled ? 1 : 0,
      suppressAutoBiometrics: false,
      autoPromptedSessionId: null,
      pinChangeAuthorizationUntil: null,
    });
  } catch (error) {
    if (__DEV__) {
      console.error("[AppLock] failed to hydrate secure state", error);
    }
    useAppLockStore.setState({ ...initialState, hydrated: true });
  }
}

export async function enableAppLock(pin: string, biometricsEnabled: boolean): Promise<void> {
  await saveAppLockPin(pin);
  const config: PersistedAppLockConfig = {
    version: 1,
    enabled: true,
    biometricsEnabled,
    failedAttempts: 0,
    lockoutUntil: null,
  };
  await persistAndApply(config);
  useAppLockStore.setState({ lockStatus: "unlocked" });
}

export async function changeAppLockPin(pin: string): Promise<void> {
  await saveAppLockPin(pin);
  const config = {
    ...currentConfig(),
    failedAttempts: 0,
    lockoutUntil: null,
  };
  await persistAndApply(config);
}

export async function disableAppLock(): Promise<void> {
  const disabled = createDisabledAppLockConfig();
  await persistAndApply(disabled);
  await deleteStoredAppLockPin();
  useAppLockStore.setState({
    lockStatus: "unlocked",
    privacyCovered: false,
    autoPromptedSessionId: null,
    suppressAutoBiometrics: false,
  });
}

export async function setAppLockBiometricsEnabled(enabled: boolean): Promise<void> {
  await persistAndApply({ ...currentConfig(), biometricsEnabled: enabled });
}

export function lockApp(options: { suppressAutoBiometrics?: boolean } = {}): void {
  const state = useAppLockStore.getState();
  if (!state.enabled) {
    return;
  }

  useAppLockStore.setState({
    lockStatus: "locked",
    lockSessionId: state.lockSessionId + 1,
    suppressAutoBiometrics: options.suppressAutoBiometrics === true,
    autoPromptedSessionId: null,
  });
}

export function unlockApp(): void {
  useAppLockStore.setState({
    lockStatus: "unlocked",
    privacyCovered: false,
    suppressAutoBiometrics: false,
  });
}

export function setAppPrivacyCovered(covered: boolean): void {
  useAppLockStore.setState({ privacyCovered: covered });
}

export function markAutomaticBiometricPrompted(sessionId: number): void {
  const state = useAppLockStore.getState();
  if (state.lockSessionId === sessionId) {
    useAppLockStore.setState({ autoPromptedSessionId: sessionId });
  }
}

export async function attemptAppLockPin(pin: string, now = Date.now()): Promise<PinAttemptResult> {
  let config = clearExpiredLockout(currentConfig(), now);
  if (
    config.failedAttempts !== useAppLockStore.getState().failedAttempts ||
    config.lockoutUntil !== useAppLockStore.getState().lockoutUntil
  ) {
    await persistAndApply(config);
  }

  if (config.lockoutUntil !== null && config.lockoutUntil > now) {
    return { kind: "lockout", lockoutUntil: config.lockoutUntil };
  }

  if (await verifyStoredAppLockPin(pin)) {
    config = { ...config, failedAttempts: 0, lockoutUntil: null };
    await persistAndApply(config);
    unlockApp();
    return { kind: "success" };
  }

  const failure = registerFailedPinAttempt(config.failedAttempts, now);
  config = { ...config, ...failure };
  await persistAndApply(config);
  return { kind: "failure", ...failure };
}

export async function verifyAppLockPin(pin: string): Promise<boolean> {
  return verifyStoredAppLockPin(pin);
}

export async function clearAppLockAttemptState(): Promise<void> {
  const config = { ...currentConfig(), failedAttempts: 0, lockoutUntil: null };
  await persistAndApply(config);
}

export function authorizePinChange(now = Date.now()): void {
  useAppLockStore.setState({ pinChangeAuthorizationUntil: now + 10 * 60_000 });
}

export function isPinChangeAuthorized(now = Date.now()): boolean {
  const authorizationUntil = useAppLockStore.getState().pinChangeAuthorizationUntil;
  return authorizationUntil !== null && authorizationUntil >= now;
}

export function revokePinChangeAuthorization(): void {
  useAppLockStore.setState({ pinChangeAuthorizationUntil: null });
}

export function consumePinChangeAuthorization(now = Date.now()): boolean {
  const authorizationUntil = useAppLockStore.getState().pinChangeAuthorizationUntil;
  useAppLockStore.setState({ pinChangeAuthorizationUntil: null });
  return authorizationUntil !== null && authorizationUntil >= now;
}
