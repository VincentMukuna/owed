import type { PersistedAppLockConfig } from "@/features/app-lock/types";

export const APP_LOCK_BACKGROUND_TIMEOUT_MS = 30_000;
export const APP_LOCK_MAX_FAILED_ATTEMPTS = 5;
export const APP_LOCK_RETRY_DELAY_MS = 30_000;

export const DEFAULT_APP_LOCK_CONFIG: PersistedAppLockConfig = {
  version: 1,
  enabled: false,
  biometricsEnabled: false,
  failedAttempts: 0,
  lockoutUntil: null,
};

export function normalizeAppLockConfig(value: unknown): PersistedAppLockConfig {
  if (!value || typeof value !== "object") {
    return DEFAULT_APP_LOCK_CONFIG;
  }

  const candidate = value as Partial<PersistedAppLockConfig>;
  if (candidate.version !== 1) {
    return DEFAULT_APP_LOCK_CONFIG;
  }

  return {
    version: 1,
    enabled: candidate.enabled === true,
    biometricsEnabled: candidate.enabled === true && candidate.biometricsEnabled === true,
    failedAttempts:
      typeof candidate.failedAttempts === "number" &&
      Number.isInteger(candidate.failedAttempts) &&
      candidate.failedAttempts >= 0
        ? candidate.failedAttempts
        : 0,
    lockoutUntil:
      typeof candidate.lockoutUntil === "number" && Number.isFinite(candidate.lockoutUntil)
        ? candidate.lockoutUntil
        : null,
  };
}

export function shouldRelockAfterBackground(backgroundedAt: number | null, now: number): boolean {
  return backgroundedAt !== null && now - backgroundedAt >= APP_LOCK_BACKGROUND_TIMEOUT_MS;
}

export function getLockoutRemainingSeconds(lockoutUntil: number | null, now: number): number {
  if (lockoutUntil === null || lockoutUntil <= now) {
    return 0;
  }

  return Math.ceil((lockoutUntil - now) / 1000);
}

export function registerFailedPinAttempt(
  currentFailedAttempts: number,
  now: number,
): Pick<PersistedAppLockConfig, "failedAttempts" | "lockoutUntil"> {
  const failedAttempts = Math.max(0, currentFailedAttempts) + 1;

  if (failedAttempts >= APP_LOCK_MAX_FAILED_ATTEMPTS) {
    return {
      failedAttempts,
      lockoutUntil: now + APP_LOCK_RETRY_DELAY_MS,
    };
  }

  return { failedAttempts, lockoutUntil: null };
}

export function clearExpiredLockout(
  config: PersistedAppLockConfig,
  now: number,
): PersistedAppLockConfig {
  if (config.lockoutUntil === null || config.lockoutUntil > now) {
    return config;
  }

  return {
    ...config,
    failedAttempts: 0,
    lockoutUntil: null,
  };
}
