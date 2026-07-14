import * as LocalAuthentication from "expo-local-authentication";

import type { BiometricAvailability } from "@/features/app-lock/types";

const unavailableBiometrics: BiometricAvailability = {
  available: false,
  authenticationTypes: [],
  icon: "generic",
};

function biometricIcon(
  authenticationTypes: LocalAuthentication.AuthenticationType[],
): BiometricAvailability["icon"] {
  if (process.env.EXPO_OS === "android") {
    return "fingerprint";
  }

  if (authenticationTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return "face";
  }

  if (authenticationTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "fingerprint";
  }

  return "generic";
}

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  if (process.env.EXPO_OS === "web") {
    return unavailableBiometrics;
  }

  try {
    const [hasHardware, isEnrolled, authenticationTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    return {
      available: hasHardware && isEnrolled && authenticationTypes.length > 0,
      authenticationTypes,
      icon: biometricIcon(authenticationTypes),
    };
  } catch {
    return unavailableBiometrics;
  }
}

export async function canUseTrustedDeviceAuthentication(): Promise<boolean> {
  if (process.env.EXPO_OS === "web") {
    return false;
  }

  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!(await getBiometricAvailability()).available) {
    return false;
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Owwed",
      promptSubtitle: "Use your phone's biometrics",
      cancelLabel: "Use PIN",
      fallbackLabel: "",
      disableDeviceFallback: true,
      biometricsSecurityLevel: "weak",
    });

    return result.success;
  } catch {
    return false;
  }
}

export type TrustedDeviceAuthenticationResult = "success" | "cancelled" | "unavailable";

export async function authenticateWithTrustedDevice(
  promptMessage = "Confirm it's you",
): Promise<TrustedDeviceAuthenticationResult> {
  if (!(await canUseTrustedDeviceAuthentication())) {
    return "unavailable";
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      promptSubtitle: "Use your phone's security",
      cancelLabel: "Cancel",
      fallbackLabel: "Use Phone Passcode",
      disableDeviceFallback: false,
      biometricsSecurityLevel: "weak",
    });

    if (result.success) {
      return "success";
    }

    return result.error === "not_available" || result.error === "not_enrolled"
      ? "unavailable"
      : "cancelled";
  } catch {
    return "unavailable";
  }
}
