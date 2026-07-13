import { useCallback, useEffect, useMemo, useState } from "react";

import { AppState } from "react-native";

import { AppPinScreen, announcePinFeedback } from "@/features/app-lock/components/app-pin-screen";
import { PinSetupFlow } from "@/features/app-lock/components/pin-setup-flow";
import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import {
  authenticateWithBiometrics,
  authenticateWithTrustedDevice,
} from "@/features/app-lock/lib/app-lock-authentication";
import { getLockoutRemainingSeconds } from "@/features/app-lock/lib/app-lock-policy";
import {
  attemptAppLockPin,
  changeAppLockPin,
  clearAppLockAttemptState,
  markAutomaticBiometricPrompted,
  unlockApp,
  useAppLockStore,
} from "@/features/app-lock/store/use-app-lock-store";
import { errorNotification, successNotification } from "@/lib/haptics";

const RECOVERY_UNAVAILABLE_MESSAGE =
  "Phone authentication isn't available. Enter your PIN to continue.";

export function AppLockScreen() {
  const biometricsEnabled = useAppLockStore((state) => state.biometricsEnabled);
  const failedAttempts = useAppLockStore((state) => state.failedAttempts);
  const lockoutUntil = useAppLockStore((state) => state.lockoutUntil);
  const lockSessionId = useAppLockStore((state) => state.lockSessionId);
  const suppressAutoBiometrics = useAppLockStore((state) => state.suppressAutoBiometrics);
  const autoPromptedSessionId = useAppLockStore((state) => state.autoPromptedSessionId);
  const { availability, resolved } = useBiometricAvailability();

  const [value, setValue] = useState("");
  const [errorToken, setErrorToken] = useState(0);
  const [countdownErrorToken, setCountdownErrorToken] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const [resettingPin, setResettingPin] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);

  const lockoutSeconds = useMemo(
    () => getLockoutRemainingSeconds(lockoutUntil, clock),
    [clock, lockoutUntil],
  );

  useEffect(() => {
    if (lockoutSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (getLockoutRemainingSeconds(lockoutUntil, now) === 0) {
        setValue("");
      }
    }, 250);
    return () => clearInterval(interval);
  }, [lockoutSeconds, lockoutUntil]);

  const completeBiometricUnlock = useCallback(async () => {
    successNotification();
    unlockApp();
    try {
      await clearAppLockAttemptState();
    } catch (error) {
      if (__DEV__) {
        console.error("[AppLock] failed to clear retry state", error);
      }
    }
  }, []);

  const tryBiometrics = useCallback(async () => {
    if (await authenticateWithBiometrics()) {
      await completeBiometricUnlock();
    }
  }, [completeBiometricUnlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (
      appState !== "active" ||
      !resolved ||
      !biometricsEnabled ||
      !availability.available ||
      suppressAutoBiometrics ||
      autoPromptedSessionId === lockSessionId
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      markAutomaticBiometricPrompted(lockSessionId);
      void tryBiometrics();
    });

    return () => cancelAnimationFrame(frame);
  }, [
    appState,
    autoPromptedSessionId,
    availability.available,
    biometricsEnabled,
    lockSessionId,
    resolved,
    suppressAutoBiometrics,
    tryBiometrics,
  ]);

  const rejectEntryDuringLockout = useCallback(() => {
    errorNotification();
    setCountdownErrorToken((current) => current + 1);
    setValue("");
    announcePinFeedback(`Try again in ${lockoutSeconds} seconds`);
  }, [lockoutSeconds]);

  const submitPin = useCallback(async (pin: string) => {
    const result = await attemptAppLockPin(pin);
    if (result.kind === "success") {
      successNotification();
      return;
    }

    errorNotification();
    setErrorToken((current) => current + 1);
    setValue("");
    announcePinFeedback("Incorrect PIN");
    setClock(Date.now());
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      if (value.length >= 4) {
        return;
      }

      const next = `${value}${digit}`;
      setValue(next);
      if (next.length !== 4) {
        return;
      }

      if (lockoutSeconds > 0) {
        rejectEntryDuringLockout();
        return;
      }

      void submitPin(next);
    },
    [lockoutSeconds, rejectEntryDuringLockout, submitPin, value],
  );

  const handleForgotPin = useCallback(async () => {
    setRecoveryMessage(null);
    const result = await authenticateWithTrustedDevice("Reset your Owed PIN");
    if (result === "success") {
      setResettingPin(true);
      return;
    }

    if (result === "unavailable") {
      setRecoveryMessage(RECOVERY_UNAVAILABLE_MESSAGE);
      announcePinFeedback(RECOVERY_UNAVAILABLE_MESSAGE);
    }
  }, []);

  if (resettingPin) {
    return (
      <PinSetupFlow
        biometricAvailability={availability}
        offerBiometrics={false}
        onCancel={() => setResettingPin(false)}
        onComplete={async (pin) => {
          await changeAppLockPin(pin);
          await clearAppLockAttemptState();
          successNotification();
          unlockApp();
        }}
      />
    );
  }

  return (
    <AppPinScreen
      biometricAvailability={availability}
      countdownErrorToken={countdownErrorToken}
      errorToken={errorToken}
      forgotPinVisible={failedAttempts > 0}
      lockoutSeconds={lockoutSeconds}
      onBiometric={
        biometricsEnabled && availability.available ? () => void tryBiometrics() : undefined
      }
      onDelete={() => setValue((current) => current.slice(0, -1))}
      onDigit={handleDigit}
      onForgotPin={() => void handleForgotPin()}
      recoveryMessage={recoveryMessage}
      showBrandMark
      title="Enter your PIN"
      value={value}
    />
  );
}
