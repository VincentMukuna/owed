import { useCallback, useEffect, useState } from "react";

import { View } from "react-native";

import { type Href, Stack, router, useLocalSearchParams } from "expo-router";

import { StyleSheet } from "react-native-unistyles";

import { AppPinScreen, announcePinFeedback } from "@/features/app-lock/components/app-pin-screen";
import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import { authenticateWithTrustedDevice } from "@/features/app-lock/lib/app-lock-authentication";
import {
  authorizePinChange,
  disableAppLock,
  setAppLockBiometricsEnabled,
  useAppLockStore,
  verifyAppLockPin,
} from "@/features/app-lock/store/use-app-lock-store";
import { useUiStore } from "@/features/debts/store/ui-store";
import { errorNotification, successNotification } from "@/lib/haptics";

type AppLockAuthAction = "change-pin" | "enable-biometrics" | "disable-biometrics" | "disable-lock";

const VALID_ACTIONS = new Set<AppLockAuthAction>([
  "change-pin",
  "enable-biometrics",
  "disable-biometrics",
  "disable-lock",
]);

function parseAction(value: string | undefined): AppLockAuthAction | null {
  return value && VALID_ACTIONS.has(value as AppLockAuthAction)
    ? (value as AppLockAuthAction)
    : null;
}

export function AppLockAuthScreen() {
  const params = useLocalSearchParams<{ action?: string }>();
  const action = parseAction(params.action);
  const enabled = useAppLockStore((state) => state.enabled);
  const showToast = useUiStore((state) => state.showToast);
  const { availability, trustedDeviceAuthenticationAvailable } = useBiometricAvailability();
  const [value, setValue] = useState("");
  const [errorToken, setErrorToken] = useState(0);
  const [busy, setBusy] = useState(false);
  const [authenticationMessage, setAuthenticationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!action || !enabled) {
      router.back();
    }
  }, [action, enabled]);

  const completeAction = useCallback(async () => {
    if (!action) {
      return;
    }

    successNotification();

    if (action === "change-pin") {
      authorizePinChange();
      router.replace("/app-lock-pin?mode=change" as Href);
      return;
    }

    if (action === "enable-biometrics") {
      await setAppLockBiometricsEnabled(true);
      showToast("Biometric unlock is on.");
    } else if (action === "disable-biometrics") {
      await setAppLockBiometricsEnabled(false);
      showToast("Biometric unlock is off.");
    } else {
      await disableAppLock();
      showToast("App lock is off.");
    }

    router.back();
  }, [action, showToast]);

  const handlePin = useCallback(
    async (pin: string) => {
      if (busy) {
        return;
      }

      setBusy(true);
      try {
        if (await verifyAppLockPin(pin)) {
          await completeAction();
          return;
        }

        errorNotification();
        setErrorToken((current) => current + 1);
        setValue("");
        announcePinFeedback("Incorrect PIN");
      } finally {
        setBusy(false);
      }
    },
    [busy, completeAction],
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (busy || value.length >= 4) {
        return;
      }

      const next = `${value}${digit}`;
      setValue(next);
      if (next.length === 4) {
        void handlePin(next);
      }
    },
    [busy, handlePin, value],
  );

  const handleTrustedDeviceAuthentication = useCallback(async () => {
    setAuthenticationMessage(null);
    const result = await authenticateWithTrustedDevice();
    if (result === "success") {
      await completeAction();
      return;
    }

    if (result === "unavailable") {
      const message = "Phone authentication isn't available. Enter your PIN to continue.";
      setAuthenticationMessage(message);
      announcePinFeedback(message);
    }
  }, [completeAction]);

  if (!action || !enabled) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "" }} />
      <AppPinScreen
        biometricAvailability={availability}
        errorToken={errorToken}
        onBiometric={
          trustedDeviceAuthenticationAvailable
            ? () => void handleTrustedDeviceAuthentication()
            : undefined
        }
        onDelete={() => setValue((current) => current.slice(0, -1))}
        onDigit={handleDigit}
        recoveryMessage={authenticationMessage}
        title="Enter your PIN"
        trustedDeviceAuthentication
        underNativeHeader
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
