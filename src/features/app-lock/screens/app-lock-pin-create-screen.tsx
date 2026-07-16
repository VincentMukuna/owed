import { useCallback, useEffect, useState } from "react";

import { View } from "react-native";

import { type Href, Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { StyleSheet } from "react-native-unistyles";

import { AppPinScreen } from "@/features/app-lock/components/app-pin-screen";
import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import {
  type PinSetupMode,
  clearPendingPinSetup,
  getPendingPinSetup,
  setPendingPinSetup,
} from "@/features/app-lock/lib/pending-pin-setup";
import {
  isPinChangeAuthorized,
  revokePinChangeAuthorization,
  useAppLockStore,
} from "@/features/app-lock/store/use-app-lock-store";

function parseMode(value: string | undefined): PinSetupMode {
  return value === "change" ? "change" : "enable";
}

export function AppLockPinCreateScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = parseMode(params.mode);
  const enabled = useAppLockStore((state) => state.enabled);
  const { resolved } = useBiometricAvailability();
  const [value, setValue] = useState("");
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
      // Only revoke when leaving create without an active confirm (pending PIN).
      if (mode === "change" && getPendingPinSetup() === null) {
        revokePinChangeAuthorization();
      }
    },
    [mode],
  );

  useFocusEffect(
    useCallback(() => {
      clearPendingPinSetup();
      setValue("");
    }, []),
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (value.length >= 4) {
        return;
      }

      const next = `${value}${digit}`;
      setValue(next);
      if (next.length === 4) {
        setPendingPinSetup(next, mode);
        router.push("/app-lock-pin-confirm" as Href);
      }
    },
    [mode, value],
  );

  if (!authorized || !resolved) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "" }} />
      <AppPinScreen
        onDelete={() => setValue((current) => current.slice(0, -1))}
        onDigit={handleDigit}
        subtitle="Choose four digits you'll remember"
        title="Create a PIN"
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
