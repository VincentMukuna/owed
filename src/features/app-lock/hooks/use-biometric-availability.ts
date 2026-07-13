import { useCallback, useEffect, useState } from "react";

import {
  canUseTrustedDeviceAuthentication,
  getBiometricAvailability,
} from "@/features/app-lock/lib/app-lock-authentication";
import type { BiometricAvailability } from "@/features/app-lock/types";

const initialAvailability: BiometricAvailability = {
  available: false,
  authenticationTypes: [],
  icon: "generic",
};

export function useBiometricAvailability() {
  const [availability, setAvailability] = useState(initialAvailability);
  const [trustedDeviceAuthenticationAvailable, setTrustedDeviceAuthenticationAvailable] =
    useState(false);
  const [resolved, setResolved] = useState(false);

  const refresh = useCallback(async () => {
    const [nextAvailability, trustedAvailable] = await Promise.all([
      getBiometricAvailability(),
      canUseTrustedDeviceAuthentication(),
    ]);
    setAvailability(nextAvailability);
    setTrustedDeviceAuthenticationAvailable(trustedAvailable);
    setResolved(true);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void refresh();
    });

    return () => cancelAnimationFrame(frame);
  }, [refresh]);

  return {
    availability,
    trustedDeviceAuthenticationAvailable,
    resolved,
    refresh,
  };
}
