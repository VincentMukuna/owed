import { type ReactNode, useEffect, useRef } from "react";

import { AppState, type AppStateStatus, View } from "react-native";

import * as ScreenCapture from "expo-screen-capture";

import { StyleSheet } from "react-native-unistyles";

import { AppLockScreen } from "@/features/app-lock/components/app-lock-screen";
import { AppPrivacyCover } from "@/features/app-lock/components/app-privacy-cover";
import { shouldRelockAfterBackground } from "@/features/app-lock/lib/app-lock-policy";
import {
  lockApp,
  setAppPrivacyCovered,
  useAppLockStore,
} from "@/features/app-lock/store/use-app-lock-store";

export function AppLockGate({ children }: { children: ReactNode }) {
  const enabled = useAppLockStore((state) => state.enabled);
  const lockStatus = useAppLockStore((state) => state.lockStatus);
  const privacyCovered = useAppLockStore((state) => state.privacyCovered);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (process.env.EXPO_OS !== "ios") {
      return;
    }

    if (enabled) {
      void ScreenCapture.enableAppSwitcherProtectionAsync(1);
    } else {
      void ScreenCapture.disableAppSwitcherProtectionAsync();
    }
  }, [enabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      const current = useAppLockStore.getState();

      if (nextState !== "active") {
        if (current.enabled) {
          if (previousState === "active") {
            backgroundedAtRef.current = Date.now();
          }
          setAppPrivacyCovered(true);
        }
        return;
      }

      if (
        current.enabled &&
        current.lockStatus === "unlocked" &&
        shouldRelockAfterBackground(backgroundedAtRef.current, Date.now())
      ) {
        lockApp();
      }

      backgroundedAtRef.current = null;
      setAppPrivacyCovered(false);
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.host}>
      {children}
      {enabled && lockStatus === "locked" ? (
        <View style={styles.lockLayer}>
          <AppLockScreen />
        </View>
      ) : null}
      {enabled && privacyCovered ? <AppPrivacyCover /> : null}
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  host: {
    flex: 1,
  },
  lockLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
  },
}));
