import { useCallback, useState } from "react";

import { usePreventRemove } from "expo-router/react-navigation";

import { AppPinScreen, announcePinFeedback } from "@/features/app-lock/components/app-pin-screen";
import { offerBiometricsThenFinish } from "@/features/app-lock/lib/offer-biometrics-then-finish";
import type { BiometricAvailability } from "@/features/app-lock/types";
import { errorNotification } from "@/lib/haptics";

type PinSetupFlowProps = {
  biometricAvailability: BiometricAvailability;
  offerBiometrics: boolean;
  onCancel?: () => void;
  onComplete: (pin: string, biometricsEnabled: boolean) => Promise<void>;
};

/** In-place create→confirm for hosts outside the nav stack (e.g. lock overlay). */
export function PinSetupFlow({
  biometricAvailability,
  offerBiometrics,
  onCancel,
  onComplete,
}: PinSetupFlowProps) {
  const [stage, setStage] = useState<"create" | "confirm">("create");
  const [createdPin, setCreatedPin] = useState("");
  const [value, setValue] = useState("");
  const [errorToken, setErrorToken] = useState(0);
  const [busy, setBusy] = useState(false);
  const [allowRouteExit, setAllowRouteExit] = useState(false);

  usePreventRemove(!onCancel && stage !== "create" && !allowRouteExit, () => {
    setValue("");
    setCreatedPin("");
    setStage("create");
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
        setValue("");
        offerBiometricsThenFinish(biometricAvailability, finish);
        return;
      }

      void finish(false);
    },
    [biometricAvailability, createdPin, finish, offerBiometrics, stage],
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
