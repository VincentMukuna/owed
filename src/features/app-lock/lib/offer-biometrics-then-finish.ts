import { Alert } from "react-native";

import { authenticateWithBiometrics } from "@/features/app-lock/lib/app-lock-authentication";
import type { BiometricAvailability } from "@/features/app-lock/types";

export function offerBiometricsThenFinish(
  availability: BiometricAvailability,
  finish: (biometricsEnabled: boolean) => Promise<void>,
): void {
  const biometricName =
    availability.icon === "face"
      ? "Face ID"
      : availability.icon === "fingerprint"
        ? "fingerprint"
        : "biometrics";
  const biometricDescription =
    availability.icon === "fingerprint"
      ? "Use your fingerprint for quicker access to Owwed. Your PIN will still work."
      : `Use ${biometricName} for quicker access to Owwed. Your PIN will still work.`;

  Alert.alert(
    `Use ${biometricName}?`,
    biometricDescription,
    [
      {
        text: "Not now",
        style: "cancel",
        onPress: () => void finish(false),
      },
      {
        text: "Sure",
        onPress: () => {
          void (async () => {
            const authenticated = await authenticateWithBiometrics();
            await finish(authenticated);
          })();
        },
      },
    ],
    { cancelable: false },
  );
}
