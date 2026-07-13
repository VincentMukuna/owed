import { useEffect, useState } from "react";

import { View } from "react-native";

import { Stack, router, useLocalSearchParams } from "expo-router";

import { StyleSheet } from "react-native-unistyles";

import { PinSetupFlow } from "@/features/app-lock/components/pin-setup-flow";
import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import {
  changeAppLockPin,
  consumePinChangeAuthorization,
  enableAppLock,
  isPinChangeAuthorized,
  revokePinChangeAuthorization,
  useAppLockStore,
} from "@/features/app-lock/store/use-app-lock-store";
import { useUiStore } from "@/features/debts/store/ui-store";
import { successNotification } from "@/lib/haptics";

type PinSetupMode = "enable" | "change";

export function AppLockPinSetupScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const enabled = useAppLockStore((state) => state.enabled);
  const showToast = useUiStore((state) => state.showToast);
  const { availability, resolved } = useBiometricAvailability();
  const mode: PinSetupMode = params.mode === "change" ? "change" : "enable";
  const [authorized] = useState(() => {
    if (mode === "change") {
      return enabled && isPinChangeAuthorized();
    }
    return !enabled;
  });

  useEffect(() => {
    if (!authorized) {
      router.back();
    }
  }, [authorized]);

  useEffect(
    () => () => {
      if (mode === "change") {
        revokePinChangeAuthorization();
      }
    },
    [mode],
  );

  if (!authorized || !resolved) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "" }} />
      <PinSetupFlow
        biometricAvailability={availability}
        offerBiometrics={mode === "enable"}
        onComplete={async (pin, biometricsEnabled) => {
          if (mode === "change") {
            if (!consumePinChangeAuthorization()) {
              router.back();
              return;
            }
            await changeAppLockPin(pin);
            showToast("PIN changed.");
          } else {
            await enableAppLock(pin, biometricsEnabled);
            showToast("App lock is on.");
          }
          successNotification();
          router.back();
        }}
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
