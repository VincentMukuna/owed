import type { AuthenticationType } from "expo-local-authentication";

export type PersistedAppLockConfig = {
  version: 1;
  enabled: boolean;
  biometricsEnabled: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
};

export type BiometricAvailability = {
  available: boolean;
  authenticationTypes: AuthenticationType[];
  icon: "face" | "fingerprint" | "generic";
};

export type PinAttemptResult =
  | { kind: "success" }
  | { kind: "failure"; failedAttempts: number; lockoutUntil: number | null }
  | { kind: "lockout"; lockoutUntil: number };
