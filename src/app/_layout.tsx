import { useEffect, useState } from "react";

import { AppState, StyleSheet } from "react-native";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UnistylesRuntime, useUnistyles } from "react-native-unistyles";

import { Toast } from "@/components/shared/toast";
import { HOME_RECENT_ACTIVITY_LIMIT } from "@/features/activity/constants";
import { loadActivities } from "@/features/activity/hooks/use-activities";
import { loadRecentActivities } from "@/features/activity/hooks/use-recent-activities";
import { activityKeys, debtKeys, peopleKeys } from "@/features/debts/hooks/query-keys";
import { loadDebts } from "@/features/debts/hooks/use-debts";
import { loadPaidThisMonth } from "@/features/debts/hooks/use-paid-this-month";
import { loadPeoplePicker } from "@/features/debts/hooks/use-people";
import { hydrateOnboardingState } from "@/features/onboarding/lib/onboarding-storage";
import { loadPeopleList } from "@/features/people/hooks/use-people-list";
import { reminderKeys } from "@/features/reminders/hooks/query-keys";
import { registerNotificationHandlers } from "@/features/reminders/lib/register-notification-handlers";
import { hydratePersistedSettings } from "@/features/reminders/lib/reminder-storage";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";
import { bootstrapCurrency } from "@/features/settings/lib/bootstrap-currency";
import { queryClient } from "@/lib/api/query-client";
import { getDb } from "@/lib/db/client";
import {
  LOADING_DETAIL_HEADER_OPTIONS,
  getModalScreenOptions,
  getStackScreenOptions,
} from "@/lib/navigation/stack-options";

export default function RootLayout() {
  const { theme } = useUnistyles();
  const [dbReady, setDbReady] = useState(false);
  const stackOptions = getStackScreenOptions(theme);
  const modalOptions = getModalScreenOptions(theme);

  useEffect(() => {
    void Promise.all([
      getDb(),
      bootstrapCurrency().then(() => hydratePersistedSettings()),
      hydrateOnboardingState(),
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
        queryKey: activityKeys.all,
        queryFn: loadActivities,
        staleTime: Number.POSITIVE_INFINITY,
      }),
      queryClient.prefetchQuery({
        queryKey: activityKeys.recent(HOME_RECENT_ACTIVITY_LIMIT),
        queryFn: () => loadRecentActivities(HOME_RECENT_ACTIVITY_LIMIT),
        staleTime: Number.POSITIVE_INFINITY,
      }),
      queryClient.prefetchQuery({
        queryKey: peopleKeys.all,
        queryFn: loadPeoplePicker,
        staleTime: Number.POSITIVE_INFINITY,
      }),
      queryClient.prefetchQuery({
        queryKey: peopleKeys.list,
        queryFn: loadPeopleList,
        staleTime: Number.POSITIVE_INFINITY,
      }),
      queryClient.prefetchQuery({
        queryKey: reminderKeys.unreadCount(),
        queryFn: () => reminderRepository.countUnread(),
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

    const frame = requestAnimationFrame(() => {
      void SplashScreen.hideAsync();
    });

    return () => cancelAnimationFrame(frame);
  }, [dbReady]);

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

  useEffect(() => {
    UnistylesRuntime.setRootViewBackgroundColor(theme.colors.background);
  }, [theme.colors.background]);

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={dbReady && theme.name === "dark" ? "light" : "dark"} />
        {dbReady ? (
          <BottomSheetModalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
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
                  sheetGrabberVisible: true,
                  sheetAllowedDetents: [0.55, 1],
                }}
              />
              <Stack.Screen
                name="notifications"
                options={{
                  ...modalOptions,
                  presentation: "modal",
                  animation: "slide_from_bottom",
                  headerShown: true,
                  title: "Notifications",
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
