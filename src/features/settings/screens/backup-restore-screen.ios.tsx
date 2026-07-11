import { useCallback, useState } from "react";

import { Alert, View } from "react-native";

import { Stack } from "expo-router";
import * as Sharing from "expo-sharing";

import { StyleSheet } from "react-native-unistyles";

import {
  BACKUP_MIME_TYPE,
  createBackupClient,
  createBackupStore,
  suggestBackupFileName,
} from "@/features/backup-restore";
import { useUiStore } from "@/features/debts/store/ui-store";
import {
  SettingsSwiftDestructiveRow,
  SettingsSwiftList,
  SettingsSwiftNavRow,
  SettingsSwiftSection,
} from "@/features/settings/components/settings-swift-list.ios";
import { useResetDatabase } from "@/features/settings/hooks/use-reset-database";
import { selectionChange } from "@/lib/haptics";

const backups = createBackupClient();
const backupStore = createBackupStore();

const BACKUP_FOOTER =
  "Export a copy of your debts, people, and payments, or restore from a saved file.";

export function BackupRestoreScreen() {
  const resetDatabase = useResetDatabase();
  const showToast = useUiStore((state) => state.showToast);

  const [backupBusy, setBackupBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);

  const handleBackupPress = useCallback(async () => {
    selectionChange();
    setBackupBusy(true);

    try {
      const created = await backups.create();
      const file = await backupStore.write(
        suggestBackupFileName(created.summary.createdAt),
        created.bytes,
      );

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        throw new Error("Native sharing is not available on this device.");
      }

      await Sharing.shareAsync(file.uri, {
        dialogTitle: "Save Owed Backup",
        mimeType: BACKUP_MIME_TYPE,
      });
    } catch (error) {
      if (__DEV__) {
        console.error("[BackupRestoreScreen] failed to create backup", error);
      }
      showToast("Could not create backup. Try again.");
    } finally {
      setBackupBusy(false);
    }
  }, [showToast]);

  const handleRestorePress = useCallback(async () => {
    selectionChange();
    setRestoreBusy(true);

    try {
      const file = await backupStore.pick();

      if (!file) {
        return;
      }

      const prepared = await backups.prepareRestore(await backupStore.read(file.uri));

      Alert.alert(
        "Replace Current Data?",
        "Restoring a backup will replace all current data in Owed.\n\nThis action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              prepared.dispose();
            },
          },
          {
            text: "Restore",
            style: "destructive",
            onPress: () => {
              void (async () => {
                setRestoreBusy(true);
                try {
                  await prepared.commit({ allowWarnings: true });
                  Alert.alert("Backup Restored", "Your data has been restored successfully.");
                } catch (error) {
                  if (__DEV__) {
                    console.error("[BackupRestoreScreen] failed to restore backup", error);
                  }
                  showToast("Could not restore backup. Try again.");
                } finally {
                  setRestoreBusy(false);
                }
              })();
            },
          },
        ],
      );
    } catch (error) {
      if (__DEV__) {
        console.error("[BackupRestoreScreen] selected backup is not valid", error);
      }
      Alert.alert("Backup Not Recognized", "The selected file isn't a valid Owed backup.", [
        { text: "Choose Another File" },
      ]);
    } finally {
      setRestoreBusy(false);
    }
  }, [showToast]);

  const handleDeleteAllDataPress = useCallback(() => {
    selectionChange();
    Alert.alert(
      "Delete All Data?",
      "This will permanently delete all debts, people, payments, activity, and reminders from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => resetDatabase.mutate(),
        },
      ],
    );
  }, [resetDatabase]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Backup & Restore" }} />

      <SettingsSwiftList>
        <SettingsSwiftSection footer={BACKUP_FOOTER}>
          <SettingsSwiftNavRow
            disabled={backupBusy}
            onPress={() => {
              void handleBackupPress();
            }}
            showsChevron={!backupBusy}
            systemImage="square.and.arrow.up"
            title="Backup"
            value={backupBusy ? "Creating…" : undefined}
          />
          <SettingsSwiftNavRow
            disabled={restoreBusy}
            onPress={() => {
              void handleRestorePress();
            }}
            showsChevron={!restoreBusy}
            systemImage="square.and.arrow.down"
            title="Restore"
            value={restoreBusy ? "Restoring…" : undefined}
          />
        </SettingsSwiftSection>

        <SettingsSwiftSection title="Danger Zone">
          <SettingsSwiftDestructiveRow
            busyLabel={resetDatabase.isPending ? "Deleting…" : undefined}
            disabled={resetDatabase.isPending}
            onPress={handleDeleteAllDataPress}
            title="Erase All Data"
          />
        </SettingsSwiftSection>
      </SettingsSwiftList>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
