import { useEffect, useMemo, useState } from "react";

import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUnistyles } from "react-native-unistyles";

import { SettleCelebration } from "@/components/shared/settle-celebration";
import { Toast } from "@/components/shared/toast";
import { HOME_RECENT_ACTIVITY_LIMIT } from "@/features/activity/constants";
import { loadRecentActivities } from "@/features/activity/hooks/use-recent-activities";
import { AppLockGate } from "@/features/app-lock/components/app-lock-gate";
import { hydrateAppLock } from "@/features/app-lock/store/use-app-lock-store";
import { activityKeys, debtKeys } from "@/features/debts/hooks/query-keys";
import { loadDebts } from "@/features/debts/hooks/use-debts";
import { loadPaidThisMonth } from "@/features/debts/hooks/use-paid-this-month";
import { hydrateOnboardingState } from "@/features/onboarding/lib/onboarding-storage";
import { reminderKeys } from "@/features/reminders/hooks/query-keys";
import { registerNotificationHandlers } from "@/features/reminders/lib/register-notification-handlers";
import { hydratePersistedSettings } from "@/features/reminders/lib/reminder-storage";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";
import { bootstrapCurrency } from "@/features/settings/lib/bootstrap-currency";
import { queryClient } from "@/lib/api/query-client";
import { getDb } from "@/lib/db/client";
import { getNavigationTheme } from "@/lib/navigation/navigation-theme";
import {
  LOADING_DETAIL_HEADER_OPTIONS,
  getModalScreenOptions,
  getStackScreenOptions,
} from "@/lib/navigation/stack-options";
import { syncNativeBackgroundColor } from "@/styles/sync-native-appearance";

export default function RootLayout() {
  const { theme } = useUnistyles();
  const [dbReady, setDbReady] = useState(false);
  const [startupFailed, setStartupFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const stackOptions = getStackScreenOptions(theme);
  const modalOptions = getModalScreenOptions(theme);
  const navigationTheme = useMemo(() => getNavigationTheme(theme), [theme]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        // Open DB first, then hydrate, then warm reads — sync runs after dbReady.
        await getDb();
        await Promise.all([
          bootstrapCurrency().then(() => hydratePersistedSettings()),
          hydrateOnboardingState(),
          hydrateAppLock(),
        ]);
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: debtKeys.all,
            queryFn: loadDebts,
            staleTime: Number.POSITIVE_INFINITY,
          }),
          queryClient.prefetchQuery({
            queryKey: debtKeys.paidThisMonth,
            queryFn: loadPaidThisMonth,
            staleTime: Number.POSITIVE_INFINITY,
          }),
          queryClient.prefetchQuery({
            queryKey: activityKeys.recent(HOME_RECENT_ACTIVITY_LIMIT),
            queryFn: () => loadRecentActivities(HOME_RECENT_ACTIVITY_LIMIT),
            staleTime: Number.POSITIVE_INFINITY,
          }),
          queryClient.prefetchQuery({
            queryKey: reminderKeys.unreadCount(),
            queryFn: () => reminderRepository.countUnread(),
            staleTime: Number.POSITIVE_INFINITY,
          }),
        ]);
        if (!cancelled) {
          setDbReady(true);
        }
      } catch (error) {
        // Never leave the user stuck on the splash screen: surface a retry
        // instead of hanging forever on DB/migration/hydration failures.
        if (__DEV__) {
          console.error("[startup] app bootstrap failed", error);
        }
        if (!cancelled) {
          setStartupFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  useEffect(() => {
    if (!dbReady && !startupFailed) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      void SplashScreen.hideAsync();
    });

    return () => cancelAnimationFrame(frame);
  }, [dbReady, startupFailed]);

  useEffect(() => {
    if (!dbReady) {
      return;
    }

    let cleanup: (() => void) | undefined;
    // Appearance.setColorScheme (theme toggle) can briefly inactive→active on Android.
    // Cooldown avoids kicking a full reminder sync for that flicker.
    let lastForegroundSyncAt = 0;
    const FOREGROUND_SYNC_COOLDOWN_MS = 15_000;

    void (async () => {
      cleanup = await registerNotificationHandlers();
      lastForegroundSyncAt = Date.now();
      await runReminderSync();
    })();

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        return;
      }
      const now = Date.now();
      if (now - lastForegroundSyncAt < FOREGROUND_SYNC_COOLDOWN_MS) {
        return;
      }
      lastForegroundSyncAt = now;
      void runReminderSync();
    });

    return () => {
      cleanup?.();
      appStateSubscription.remove();
    };
  }, [dbReady]);

  useEffect(() => {
    syncNativeBackgroundColor(theme.colors.background);
  }, [theme.colors.background]);

  const handleRetryStartup = () => {
    setStartupFailed(false);
    setDbReady(false);
    setRetryCount((count) => count + 1);
  };

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={dbReady && theme.name === "dark" ? "light" : "dark"} />
        {startupFailed ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
              Something went wrong
            </Text>
            <Text style={[styles.errorBody, { color: theme.colors.muted }]}>
              Owwed couldn&apos;t finish loading your data. Your information is still saved on this
              device.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try again"
              onPress={handleRetryStartup}
              style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[styles.errorButtonLabel, { color: theme.colors.primaryForeground }]}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : null}
        {dbReady ? (
          <AppLockGate>
            <ThemeProvider value={navigationTheme}>
              <BottomSheetModalProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.colors.background },
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
                  <Stack.Screen name="screenshot-automation" options={{ animation: "none" }} />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="add-debt"
                    options={{
                      ...modalOptions,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      headerShown: true,
                      title: "Add debt",
                    }}
                  />
                  <Stack.Screen
                    name="debt/[id]"
                    options={{
                      ...stackOptions,
                      ...LOADING_DETAIL_HEADER_OPTIONS,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="person/[id]"
                    options={{
                      ...stackOptions,
                      ...LOADING_DETAIL_HEADER_OPTIONS,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="appearance"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Appearance",
                    }}
                  />
                  <Stack.Screen
                    name="reminders-settings"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Reminders",
                    }}
                  />
                  <Stack.Screen
                    name="app-lock"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "App Lock",
                    }}
                  />
                  <Stack.Screen
                    name="app-lock-pin"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "",
                    }}
                  />
                  <Stack.Screen
                    name="app-lock-pin-confirm"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "",
                    }}
                  />
                  <Stack.Screen
                    name="app-lock-auth"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "",
                    }}
                  />
                  <Stack.Screen
                    name="backup-restore"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Backup & Restore",
                    }}
                  />
                  <Stack.Screen
                    name="brand-color"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Appearance",
                    }}
                  />
                  <Stack.Screen
                    name="activity"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Activity",
                    }}
                  />
                  <Stack.Screen
                    name="add-person"
                    options={{
                      ...modalOptions,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      headerShown: true,
                      title: "Add person",
                    }}
                  />
                  <Stack.Screen
                    name="edit-person"
                    options={{
                      ...modalOptions,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      headerShown: true,
                      title: "Edit person",
                    }}
                  />
                  <Stack.Screen
                    name="edit-debt"
                    options={{
                      ...modalOptions,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      headerShown: true,
                      title: "Edit Debt",
                    }}
                  />
                  <Stack.Screen
                    name="record-payment"
                    options={{
                      ...modalOptions,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      headerShown: true,
                      title: "Add Payment",
                    }}
                  />
                  <Stack.Screen
                    name="notifications"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Notifications",
                    }}
                  />
                  <Stack.Screen
                    name="currency"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Pick a Currency",
                    }}
                  />
                  <Stack.Screen
                    name="currency-convert"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Switch currency",
                    }}
                  />
                  <Stack.Screen
                    name="share-feedback"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Share Feedback",
                    }}
                  />
                  <Stack.Screen
                    name="help-center"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "Help Center",
                    }}
                  />
                  <Stack.Screen
                    name="about"
                    options={{
                      ...stackOptions,
                      headerShown: true,
                      headerLargeTitleEnabled: false,
                      animation: "slide_from_right",
                      title: "About",
                    }}
                  />
                </Stack>
              </BottomSheetModalProvider>
            </ThemeProvider>
            <Toast />
            <SettleCelebration />
          </AppLockGate>
        ) : null}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  errorButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
