import { useCallback, useState } from "react";

import { Modal, Platform, Pressable, Text, View } from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { reminderTimeToDate, toReminderTime24 } from "@/features/settings/lib/format-reminder-time";

type ReminderTimePickerModalProps = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: (time24: string) => void;
};

export function ReminderTimePickerModal({
  visible,
  value,
  onClose,
  onSave,
}: ReminderTimePickerModalProps) {
  const { theme } = useUnistyles();
  const [draft, setDraft] = useState(() => reminderTimeToDate(value));

  const handleChange = useCallback(
    (_event: unknown, date?: Date) => {
      if (!date) {
        return;
      }

      setDraft(date);

      if (Platform.OS === "android") {
        onSave(toReminderTime24(date));
        onClose();
      }
    },
    [onClose, onSave],
  );

  const handleDone = useCallback(() => {
    onSave(toReminderTime24(draft));
    onClose();
  }, [draft, onClose, onSave]);

  if (!visible) {
    return null;
  }

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        is24Hour={false}
        mode="time"
        onChange={handleChange}
        themeVariant={theme.name}
        value={draft}
      />
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Notification time</Text>
            <PressableScale onPress={handleDone} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </PressableScale>
          </View>
          <DateTimePicker
            display="spinner"
            mode="time"
            onChange={handleChange}
            style={styles.picker}
            themeVariant={theme.name}
            value={draft}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  picker: {
    height: 220,
  },
}));
