import { useCallback, useState } from "react";

import { AppState, ScrollView, Switch, Text, View } from "react-native";

import { Stack, useFocusEffect } from "expo-router";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
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
import { ReminderTimePickerModal } from "@/features/settings/components/reminder-time-picker-modal";
import {
  SettingsCard,
  SettingsDetailRow,
  SettingsHelperText,
  SettingsSection,
} from "@/features/settings/components/settings-ui";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { formatReminderTimeDisplay } from "@/features/settings/lib/format-reminder-time";
import { selectionChange } from "@/lib/haptics";

export function RemindersSettingsScreen() {
  const { theme } = useUnistyles();
  const defaultReminderTime = useSettingsStore((state) => state.defaultReminderTime);
  const overdueReminderEnabled = useSettingsStore((state) => state.overdueReminderEnabled);

  const [permissionState, setPermissionState] = useState<NotificationPermissionState>("not-asked");
  const [timePickerOpen, setTimePickerOpen] = useState(false);

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

  const handlePermissionPress = useCallback(async () => {
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

  const permissionActionLabel =
    permissionState === "off" ? "Open Settings" : "Enable Notifications";

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Reminders" }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {permissionState !== "allowed" ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Turn on notifications to get reminders on due dates.
            </Text>
            <PressableScale
              onPress={() => void handlePermissionPress()}
              style={styles.bannerButton}
            >
              <Text style={styles.bannerButtonText}>{permissionActionLabel}</Text>
            </PressableScale>
          </View>
        ) : null}

        <SettingsSection>
          <SettingsHelperText>
            Owwed sends a daily reminder at your chosen time for debts on their due dates.
          </SettingsHelperText>
          <SettingsCard>
            <SettingsDetailRow
              label="Reminder Time"
              onPress={() => {
                selectionChange();
                setTimePickerOpen(true);
              }}
              value={formatReminderTimeDisplay(defaultReminderTime)}
            />
            <SettingsDetailRow
              bordered
              description="Nudge me the day after a missed date"
              label="Overdue Reminders"
              trailing={
                <Switch
                  onValueChange={(value) => {
                    void handleOverdueToggle(value);
                  }}
                  thumbColor={theme.colors.primaryForeground}
                  trackColor={{ false: theme.colors.switchTrackOff, true: theme.colors.primary }}
                  value={overdueReminderEnabled}
                />
              }
            />
          </SettingsCard>
        </SettingsSection>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  banner: {
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    backgroundColor: theme.colors.selection,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  bannerButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primaryForeground,
  },
}));
