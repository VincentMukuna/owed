import { useCallback, useState } from "react";

import { AppState, View } from "react-native";

import { Stack, useFocusEffect } from "expo-router";

import { Button, Text, Toggle } from "@expo/ui/swift-ui";
import { buttonStyle } from "@expo/ui/swift-ui/modifiers";
import { StyleSheet } from "react-native-unistyles";

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
  SettingsSwiftBodyText,
  SettingsSwiftDetailRow,
  SettingsSwiftList,
  SettingsSwiftSection,
  useSettingsSwiftTheme,
} from "@/features/settings/components/settings-swift-list.ios";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { formatReminderTimeDisplay } from "@/features/settings/lib/format-reminder-time";
import { selectionChange } from "@/lib/haptics";

export function RemindersSettingsScreen() {
  const { rowTitleModifiers, rowDescriptionModifiers } = useSettingsSwiftTheme();
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

      <SettingsSwiftList>
        {permissionState !== "allowed" ? (
          <SettingsSwiftSection title="Notifications">
            <SettingsSwiftBodyText>
              Turn on notifications to get reminders on promised dates.
            </SettingsSwiftBodyText>
            <Button
              label={permissionActionLabel}
              onPress={() => {
                void handlePermissionPress();
              }}
              modifiers={[buttonStyle("borderedProminent")]}
            />
          </SettingsSwiftSection>
        ) : null}

        <SettingsSwiftSection footer="Owwed sends a daily reminder at your chosen time for debts with promised dates.">
          <SettingsSwiftDetailRow
            onPress={() => {
              selectionChange();
              setTimePickerOpen(true);
            }}
            title="Reminder Time"
            value={formatReminderTimeDisplay(defaultReminderTime)}
          />
          <Toggle
            isOn={overdueReminderEnabled}
            onIsOnChange={(enabled) => {
              void handleOverdueToggle(enabled);
            }}
          >
            <Text modifiers={rowTitleModifiers}>Overdue Reminders</Text>
            <Text modifiers={rowDescriptionModifiers}>Nudge me the day after a missed date</Text>
          </Toggle>
        </SettingsSwiftSection>
      </SettingsSwiftList>

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
}));
