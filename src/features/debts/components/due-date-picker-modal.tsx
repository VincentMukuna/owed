import { useCallback, useEffect, useState } from "react";

import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import { PressableScale } from "@/components/shared/pressable-scale";
import { isoDateToDate, toISODate } from "@/features/debts/lib/format-dates";

type DueDatePickerModalProps = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: (isoDate: string) => void;
};

export function DueDatePickerModal({ visible, value, onClose, onSave }: DueDatePickerModalProps) {
  const [draft, setDraft] = useState(() => isoDateToDate(value));

  useEffect(() => {
    if (visible) {
      setDraft(isoDateToDate(value));
    }
  }, [value, visible]);

  const handleChange = useCallback(
    (_event: unknown, date?: Date) => {
      if (!date) {
        return;
      }

      setDraft(date);

      if (Platform.OS === "android") {
        onSave(toISODate(date));
        onClose();
      }
    },
    [onClose, onSave],
  );

  const handleDone = useCallback(() => {
    onSave(toISODate(draft));
    onClose();
  }, [draft, onClose, onSave]);

  if (!visible) {
    return null;
  }

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        display="default"
        mode="date"
        onChange={handleChange}
        value={draft}
      />
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Promised date</Text>
            <PressableScale onPress={handleDone} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </PressableScale>
          </View>
          <DateTimePicker
            display="spinner"
            mode="date"
            onChange={handleChange}
            style={styles.picker}
            value={draft}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
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
    color: "#1A1A18",
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A3A2A",
  },
  picker: {
    height: 220,
  },
});
