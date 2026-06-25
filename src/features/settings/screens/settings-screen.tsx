import type { ComponentType } from "react";
import { useCallback, useRef, useState } from "react";

import { AppState, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { useFocusEffect } from "expo-router";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ChevronRight } from "lucide-react-native";

import { TabScreen, useTabScrollPadding } from "@/components/navigation/tab-screen";
import { PressableScale } from "@/components/shared/pressable-scale";
import { debtRepository } from "@/features/debts/repositories/debt-repository";
import {
  type NotificationPermissionState,
  getNotificationPermissionState,
  openOsNotificationSettings,
  requestOsNotificationPermissions,
} from "@/features/reminders/lib/notification-permissions";
import {
  saveDefaultReminderTime,
  saveOverdueReminderEnabled,
} from "@/features/reminders/lib/reminder-storage";
import { runReminderSync } from "@/features/reminders/lib/reminder-sync";
import {
  CurrencyConversionSheet,
  type CurrencyConversionSheetRef,
} from "@/features/settings/components/currency-conversion-sheet";
import {
  CurrencyPickerSheet,
  type CurrencyPickerSheetRef,
} from "@/features/settings/components/currency-picker-sheet";
import { ReminderTimePickerModal } from "@/features/settings/components/reminder-time-picker-modal";
import {
  useChangeCurrency,
  useCurrentCurrency,
} from "@/features/settings/hooks/use-change-currency";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { formatReminderTimeDisplay } from "@/features/settings/lib/format-reminder-time";
import { selectionChange } from "@/lib/haptics";

let DevToolsSection: ComponentType | null = null;

if (__DEV__) {
  // Dev-only require keeps @faker-js/faker out of production bundles.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DevToolsSection = require("@/features/settings/dev/dev-tools-section").DevToolsSection;
}

function permissionLabel(state: NotificationPermissionState): string {
  switch (state) {
    case "allowed":
      return "Allowed";
    case "off":
      return "Off";
    default:
      return "Not set";
  }
}

export function SettingsScreen() {
  const tabScrollPadding = useTabScrollPadding();
  const defaultCurrency = useCurrentCurrency();
  const defaultReminderTime = useSettingsStore((state) => state.defaultReminderTime);
  const overdueReminderEnabled = useSettingsStore((state) => state.overdueReminderEnabled);
  const changeCurrency = useChangeCurrency();
  const currencyPickerRef = useRef<CurrencyPickerSheetRef>(null);
  const conversionSheetRef = useRef<CurrencyConversionSheetRef>(null);

  const [permissionState, setPermissionState] = useState<NotificationPermissionState>("not-asked");
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [conversionTarget, setConversionTarget] = useState<string | null>(null);
  const [totalRemaining, setTotalRemaining] = useState(0);

  const refreshPermissionState = useCallback(() => {
    void getNotificationPermissionState().then(setPermissionState);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermissionState();
    }, [refreshPermissionState]),
  );

  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          refreshPermissionState();
        }
      });

      return () => subscription.remove();
    }, [refreshPermissionState]),
  );

  const handleReminderTimeSave = useCallback(async (time24: string) => {
    await saveDefaultReminderTime(time24);
    await runReminderSync();
  }, []);

  const handleOverdueToggle = useCallback(async (enabled: boolean) => {
    selectionChange();
    await saveOverdueReminderEnabled(enabled);
    await runReminderSync();
  }, []);

  const handleNotificationsPress = useCallback(async () => {
    selectionChange();

    if (permissionState === "off") {
      await openOsNotificationSettings();
      return;
    }

    if (permissionState === "not-asked") {
      const state = await requestOsNotificationPermissions();
      refreshPermissionState();
      if (state === "allowed") {
        await runReminderSync();
      }
    }
  }, [permissionState, refreshPermissionState]);

  const handleCurrencySelect = useCallback(
    async (code: string) => {
      if (code === defaultCurrency) {
        return;
      }

      const hasDebts = await debtRepository.hasAnyDebts();

      if (!hasDebts) {
        changeCurrency.mutate({
          fromCurrency: defaultCurrency,
          toCurrency: code,
        });
        return;
      }

      const total = await debtRepository.getTotalRemaining();
      setTotalRemaining(total);
      setConversionTarget(code);
      requestAnimationFrame(() => {
        conversionSheetRef.current?.present();
      });
    },
    [changeCurrency, defaultCurrency],
  );

  const handleConversionConfirm = useCallback(
    (rate: number) => {
      if (!conversionTarget) {
        return;
      }

      changeCurrency.mutate(
        {
          fromCurrency: defaultCurrency,
          toCurrency: conversionTarget,
          rate,
        },
        {
          onSuccess: () => {
            conversionSheetRef.current?.dismiss();
            setConversionTarget(null);
          },
        },
      );
    },
    [changeCurrency, conversionTarget, defaultCurrency],
  );

  const handleConversionClose = useCallback(() => {
    if (changeCurrency.isPending) {
      return;
    }

    setConversionTarget(null);
  }, [changeCurrency.isPending]);

  return (
    <BottomSheetModalProvider>
      <TabScreen>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: tabScrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.card}>
              <PressableScale
                onPress={() => {
                  selectionChange();
                  currencyPickerRef.current?.present();
                }}
                style={styles.row}
              >
                <Text style={styles.icon}>💱</Text>
                <Text style={styles.label}>Default currency</Text>
                <View style={styles.valueWrap}>
                  <Text style={styles.value}>{defaultCurrency}</Text>
                  <ChevronRight color="#D8D8D0" size={16} strokeWidth={2} />
                </View>
              </PressableScale>

              <PressableScale
                onPress={() => {
                  selectionChange();
                  setTimePickerOpen(true);
                }}
                style={[styles.row, styles.rowBorder]}
              >
                <Text style={styles.icon}>⏰</Text>
                <Text style={styles.label}>Default reminder time</Text>
                <View style={styles.valueWrap}>
                  <Text style={styles.value}>{formatReminderTimeDisplay(defaultReminderTime)}</Text>
                  <ChevronRight color="#D8D8D0" size={16} strokeWidth={2} />
                </View>
              </PressableScale>

              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.icon}>📣</Text>
                <View style={styles.toggleCopy}>
                  <Text style={styles.label}>Overdue reminders</Text>
                  <Text style={styles.subLabel}>One gentle nudge the day after</Text>
                </View>
                <Switch
                  onValueChange={(value) => {
                    void handleOverdueToggle(value);
                  }}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#DDDDD8", true: "#1A3A2A" }}
                  value={overdueReminderEnabled}
                />
              </View>

              <PressableScale
                onPress={() => {
                  void handleNotificationsPress();
                }}
                style={[styles.row, styles.rowBorder]}
              >
                <Text style={styles.icon}>🔔</Text>
                <Text style={styles.label}>Notifications</Text>
                <View style={styles.valueWrap}>
                  <Text style={styles.value}>{permissionLabel(permissionState)}</Text>
                  <ChevronRight color="#D8D8D0" size={16} strokeWidth={2} />
                </View>
              </PressableScale>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.label}>App lock</Text>
                <View style={styles.valueWrap}>
                  <Text style={styles.value}>Off</Text>
                  <ChevronRight color="#D8D8D0" size={16} strokeWidth={2} />
                </View>
              </View>
              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.icon}>📤</Text>
                <Text style={styles.label}>Export data</Text>
                <View style={styles.valueWrap}>
                  <Text style={styles.value}>CSV</Text>
                  <ChevronRight color="#D8D8D0" size={16} strokeWidth={2} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.icon}>ℹ️</Text>
                <Text style={styles.label}>App version</Text>
                <Text style={styles.value}>1.0.0</Text>
              </View>
              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.icon}>💬</Text>
                <Text style={styles.label}>Send feedback</Text>
                <ChevronRight color="#D8D8D0" size={16} strokeWidth={2} />
              </View>
            </View>
          </View>

          {DevToolsSection ? <DevToolsSection /> : null}
        </ScrollView>

        <CurrencyPickerSheet
          onSelect={(code) => {
            void handleCurrencySelect(code);
          }}
          ref={currencyPickerRef}
          value={defaultCurrency}
        />

        <CurrencyConversionSheet
          fromCurrency={defaultCurrency}
          isSubmitting={changeCurrency.isPending}
          onClose={handleConversionClose}
          onConfirm={handleConversionConfirm}
          ref={conversionSheetRef}
          toCurrency={conversionTarget ?? defaultCurrency}
          totalRemaining={totalRemaining}
        />

        {timePickerOpen ? (
          <ReminderTimePickerModal
            key={defaultReminderTime}
            onClose={() => setTimePickerOpen(false)}
            onSave={(time24) => {
              void handleReminderTimeSave(time24);
            }}
            value={defaultReminderTime}
            visible
          />
        ) : null}
      </TabScreen>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A18",
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  icon: {
    fontSize: 16,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A18",
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  subLabel: {
    fontSize: 12,
    color: "#8A8A82",
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 14,
    color: "#8A8A82",
  },
});
