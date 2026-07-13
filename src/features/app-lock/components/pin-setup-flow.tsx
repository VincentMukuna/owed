import { useCallback, useState } from "react";

import { Text, View } from "react-native";

import { usePreventRemove } from "expo-router/react-navigation";

import { ShieldCheck } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Button } from "@/components/ui/button";
import { AppPinScreen, announcePinFeedback } from "@/features/app-lock/components/app-pin-screen";
import { authenticateWithBiometrics } from "@/features/app-lock/lib/app-lock-authentication";
import type { BiometricAvailability } from "@/features/app-lock/types";
import { errorNotification } from "@/lib/haptics";

type PinSetupFlowProps = {
  biometricAvailability: BiometricAvailability;
  offerBiometrics: boolean;
  onCancel?: () => void;
  onComplete: (pin: string, biometricsEnabled: boolean) => Promise<void>;
};

export function PinSetupFlow({
  biometricAvailability,
  offerBiometrics,
  onCancel,
  onComplete,
}: PinSetupFlowProps) {
  const { theme } = useUnistyles();
  const [stage, setStage] = useState<"create" | "confirm" | "biometrics">("create");
  const [createdPin, setCreatedPin] = useState("");
  const [value, setValue] = useState("");
  const [errorToken, setErrorToken] = useState(0);
  const [busy, setBusy] = useState(false);
  const [allowRouteExit, setAllowRouteExit] = useState(false);

  usePreventRemove(!onCancel && stage !== "create" && !allowRouteExit, () => {
    setValue("");
    if (stage === "confirm") {
      setCreatedPin("");
      setStage("create");
      return;
    }

    setStage("confirm");
  });

  const finish = useCallback(
    async (biometricsEnabled: boolean) => {
      if (busy) {
        return;
      }

      setBusy(true);
      setAllowRouteExit(true);
      try {
        await onComplete(createdPin, biometricsEnabled);
      } catch (error) {
        setAllowRouteExit(false);
        throw error;
      } finally {
        setBusy(false);
      }
    },
    [busy, createdPin, onComplete],
  );

  const handleCompleteEntry = useCallback(
    (pin: string) => {
      if (stage === "create") {
        setCreatedPin(pin);
        setValue("");
        setStage("confirm");
        return;
      }

      if (pin !== createdPin) {
        errorNotification();
        announcePinFeedback("PINs don't match. Try confirming again.");
        setErrorToken((current) => current + 1);
        setValue("");
        return;
      }

      if (offerBiometrics && biometricAvailability.available) {
        setStage("biometrics");
        return;
      }

      void finish(false);
    },
    [biometricAvailability.available, createdPin, finish, offerBiometrics, stage],
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

  if (stage === "biometrics") {
    return (
      <View style={styles.offerScreen}>
        <View style={styles.offerContent}>
          <View style={styles.offerIcon}>
            <ShieldCheck color={theme.colors.primary} size={34} strokeWidth={1.8} />
          </View>
          <Text style={styles.offerTitle}>Unlock faster</Text>
          <Text style={styles.offerBody}>
            {
              "Use your phone's biometrics to open Owed. Your four-digit PIN will always be available."
            }
          </Text>
        </View>

        <View style={styles.offerActions}>
          <Button
            disabled={busy}
            fullWidth
            onPress={() => {
              void (async () => {
                if (await authenticateWithBiometrics()) {
                  await finish(true);
                }
              })();
            }}
            size="lg"
          >
            Use biometrics
          </Button>
          <Button disabled={busy} fullWidth onPress={() => void finish(false)} variant="ghost">
            Not now
          </Button>
        </View>
      </View>
    );
  }

  return (
    <AppPinScreen
      errorToken={errorToken}
      onBack={
        onCancel
          ? stage === "confirm"
            ? () => {
                setCreatedPin("");
                setValue("");
                setStage("create");
              }
            : onCancel
          : undefined
      }
      onDelete={() => setValue((current) => current.slice(0, -1))}
      onDigit={handleDigit}
      subtitle={
        stage === "create"
          ? "Choose four digits you'll remember"
          : "Enter the same four digits again"
      }
      title={stage === "create" ? "Create a PIN" : "Confirm your PIN"}
      underNativeHeader={!onCancel}
      value={value}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  offerScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  offerContent: {
    alignItems: "center",
    gap: 12,
  },
  offerIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
    marginBottom: 8,
  },
  offerTitle: {
    color: theme.colors.text,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  offerBody: {
    maxWidth: 340,
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  offerActions: {
    gap: 4,
  },
}));
