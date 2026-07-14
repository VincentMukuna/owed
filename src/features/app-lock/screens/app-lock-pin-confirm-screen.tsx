import { useCallback, useEffect, useState } from "react";

import { View } from "react-native";

import { type Href, Stack, router } from "expo-router";

import { StyleSheet } from "react-native-unistyles";

import { AppPinScreen, announcePinFeedback } from "@/features/app-lock/components/app-pin-screen";
import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import { offerBiometricsThenFinish } from "@/features/app-lock/lib/offer-biometrics-then-finish";
import {
  clearPendingPinSetup,
  getPendingPinSetup,
} from "@/features/app-lock/lib/pending-pin-setup";
import {
  changeAppLockPin,
  consumePinChangeAuthorization,
  enableAppLock,
  revokePinChangeAuthorization,
} from "@/features/app-lock/store/use-app-lock-store";
import { useUiStore } from "@/features/debts/store/ui-store";
import { errorNotification, successNotification } from "@/lib/haptics";

function dismissPinSetup() {
  clearPendingPinSetup();
  revokePinChangeAuthorization();
  if (router.canDismiss()) {
    router.dismissTo("/app-lock" as Href);
    return;
  }
  router.replace("/app-lock" as Href);
}

export function AppLockPinConfirmScreen() {
  const showToast = useUiStore((state) => state.showToast);
  const { availability, resolved } = useBiometricAvailability();
  const [pending] = useState(() => getPendingPinSetup());
  const [value, setValue] = useState("");
  const [errorToken, setErrorToken] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pending) {
      router.back();
    }
  }, [pending]);

  const finish = useCallback(
    async (biometricsEnabled: boolean) => {
      if (!pending || busy) {
        return;
      }

      setBusy(true);
      try {
        if (pending.mode === "change") {
          if (!consumePinChangeAuthorization()) {
            dismissPinSetup();
            return;
          }
          await changeAppLockPin(pending.pin);
          showToast("PIN changed.");
        } else {
          await enableAppLock(pending.pin, biometricsEnabled);
          showToast("App lock is on.");
        }
        successNotification();
        dismissPinSetup();
      } finally {
        setBusy(false);
      }
    },
    [busy, pending, showToast],
  );

  const handleCompleteEntry = useCallback(
    (pin: string) => {
      if (!pending) {
        return;
      }

      if (pin !== pending.pin) {
        errorNotification();
        announcePinFeedback("PINs don't match. Try confirming again.");
        setErrorToken((current) => current + 1);
        setValue("");
        return;
      }

      if (pending.mode === "enable" && availability.available) {
        setValue("");
        offerBiometricsThenFinish(availability, finish);
        return;
      }

      void finish(false);
    },
    [availability, finish, pending],
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (value.length >= 4 || busy) {
        return;
      }

      const next = `${value}${digit}`;
      setValue(next);
      if (next.length === 4) {
        handleCompleteEntry(next);
      }
    },
    [busy, handleCompleteEntry, value],
  );

  if (!pending || !resolved) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "" }} />
      <AppPinScreen
        errorToken={errorToken}
        onDelete={() => setValue((current) => current.slice(0, -1))}
        onDigit={handleDigit}
        subtitle="Enter the same four digits again"
        title="Confirm your PIN"
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
