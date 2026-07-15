import { useEffect, useState } from "react";

import { LogBox, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { StyleSheet } from "react-native-unistyles";

import { prepareScreenshotAutomation } from "@/features/settings/dev/screenshot-automation";
import {
  parseScreenshotAutomationConfig,
  screenshotTargetHref,
} from "@/features/settings/dev/screenshot-automation-config";

type AutomationStatus = "preparing" | "invalid" | "unavailable" | "failed";

export default function ScreenshotAutomationRoute() {
  const params = useLocalSearchParams<{ target?: string | string[]; theme?: string | string[] }>();
  const [status, setStatus] = useState<AutomationStatus>(() =>
    __DEV__ ? "preparing" : "unavailable",
  );

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    // Marketing captures should never contain development warning chrome. This
    // route only exists as an active bootstrap in development builds.
    LogBox.ignoreAllLogs();

    const config = parseScreenshotAutomationConfig(params);
    if (!config) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;
    void prepareScreenshotAutomation(config)
      .then(() => {
        if (!cancelled) {
          router.replace(screenshotTargetHref(config.target));
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
  }, [params]);

  return (
    <View accessibilityLabel={`screenshot-automation-${status}`} style={styles.screen}>
      <Text style={styles.text}>{statusCopy(status)}</Text>
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
