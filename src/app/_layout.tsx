import { useEffect, useState } from "react";

import { AppState, StyleSheet } from "react-native";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Toast } from "@/components/shared/toast";
import { activityKeys, debtKeys } from "@/features/debts/hooks/query-keys";
import { fetchActivityViews } from "@/features/debts/lib/fetch-activities";
import { fetchDebtCardViews } from "@/features/debts/lib/fetch-debts";
import { hydrateOnboardingState } from "@/features/onboarding/lib/onboarding-storage";
import { reminderKeys } from "@/features/reminders/hooks/query-keys";
import { fetchUnreadReminderCount } from "@/features/reminders/lib/fetch-reminders";
import { registerNotificationHandlers } from "@/features/reminders/lib/register-notification-handlers";
import { hydrateReminderSettings } from "@/features/reminders/lib/reminder-storage";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { queryClient } from "@/lib/api/query-client";
import { getDb } from "@/lib/db/client";
import {
  APP_BACKGROUND,
  MODAL_SCREEN_OPTIONS,
  STACK_SCREEN_OPTIONS,
} from "@/lib/navigation/stack-options";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    void Promise.all([
      getDb(),
      hydrateOnboardingState(),
      hydrateReminderSettings(),
      queryClient.prefetchQuery({
        queryKey: debtKeys.all,
        queryFn: fetchDebtCardViews,
        staleTime: Number.POSITIVE_INFINITY,
      }),
      queryClient.prefetchQuery({
        queryKey: activityKeys.all,
        queryFn: fetchActivityViews,
        staleTime: Number.POSITIVE_INFINITY,
      }),
      queryClient.prefetchQuery({
        queryKey: reminderKeys.unreadCount(),
        queryFn: fetchUnreadReminderCount,
        staleTime: Number.POSITIVE_INFINITY,
      }),
    ]).then(() => {
      setDbReady(true);
    });
  }, []);

  useEffect(() => {
    if (!dbReady) {
      return;
    }

    let cleanup: (() => void) | undefined;

    void (async () => {
      cleanup = await registerNotificationHandlers();
      await runReminderSync();
    })();

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void runReminderSync();
      }
    });

    return () => {
      cleanup?.();
      appStateSubscription.remove();
    };
  }, [dbReady]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        {dbReady ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: APP_BACKGROUND },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="add-debt"
              options={{
                ...MODAL_SCREEN_OPTIONS,
                presentation: "modal",
                animation: "slide_from_bottom",
                headerShown: true,
                title: "Add debt",
              }}
            />
            <Stack.Screen
              name="debt/[id]"
              options={{
                ...STACK_SCREEN_OPTIONS,
                headerShown: true,
                headerLargeTitleEnabled: false,
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="record-payment"
              options={{
                ...MODAL_SCREEN_OPTIONS,
                presentation: "modal",
                animation: "slide_from_bottom",
                headerShown: true,
                title: "Add payment",
                sheetGrabberVisible: true,
                sheetAllowedDetents: [0.55, 1],
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                ...MODAL_SCREEN_OPTIONS,
                presentation: "modal",
                animation: "slide_from_bottom",
                headerShown: true,
                title: "Notifications",
              }}
            />
          </Stack>
        ) : null}
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
