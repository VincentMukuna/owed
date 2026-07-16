import { useEffect, useMemo, useState } from "react";

import { LogBox, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { StyleSheet } from "react-native-unistyles";

import { prepareScreenshotAutomation } from "@/features/settings/dev/screenshot-automation";
import { parseScreenshotAutomationConfig } from "@/features/settings/dev/screenshot-automation-config";

type AutomationStatus = "preparing" | "invalid" | "unavailable" | "failed";

export default function ScreenshotAutomationRoute() {
  const params = useLocalSearchParams<{ target?: string | string[]; theme?: string | string[] }>();
  const config = useMemo(
    () => (__DEV__ ? parseScreenshotAutomationConfig(params) : null),
    [params],
  );
  const [status, setStatus] = useState<AutomationStatus>(() =>
    __DEV__ ? "preparing" : "unavailable",
  );

  useEffect(() => {
    if (!__DEV__ || !config) {
      return;
    }

    // Marketing captures should never contain development warning chrome. This
    // route only exists as an active bootstrap in development builds.
    LogBox.ignoreAllLogs();

    let cancelled = false;
    void prepareScreenshotAutomation(config)
      .then((href) => {
        if (!cancelled) {
          router.replace(href);
        }
      })
      .catch((error: unknown) => {
        if (__DEV__) {
          console.error("[screenshot-automation] setup failed", error);
        }
        if (!cancelled) {
          setStatus("failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [config]);

  // Invalid requests are derived rather than set in an effect to avoid
  // cascading renders; a missing config in dev means the params were unusable.
  const displayStatus: AutomationStatus = __DEV__ && !config ? "invalid" : status;

  return (
    <View accessibilityLabel={`screenshot-automation-${displayStatus}`} style={styles.screen}>
      <Text style={styles.text}>{statusCopy(displayStatus)}</Text>
    </View>
  );
}

function statusCopy(status: AutomationStatus): string {
  switch (status) {
    case "preparing":
      return "Preparing screenshot data…";
    case "invalid":
      return "Invalid screenshot request.";
    case "unavailable":
      return "Screenshot automation is unavailable.";
    case "failed":
      return "Screenshot setup failed.";
  }
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.muted,
    fontSize: 14,
  },
}));
