import { useCallback, useState } from "react";

import { Modal, Platform, Pressable, Text, View } from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { FullWindowOverlay } from "react-native-screens";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { isoDateToDate, toISODate } from "@/features/debts/lib/format-dates";

type DueDatePickerModalProps = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: (isoDate: string) => void;
};

export function DueDatePickerModal({ visible, value, onClose, onSave }: DueDatePickerModalProps) {
  const { theme } = useUnistyles();
  const [draft, setDraft] = useState(() => isoDateToDate(value));
  const [wasVisible, setWasVisible] = useState(visible);

  // Reset the draft to the incoming value each time the picker opens. Handled
  // during render (not in an effect) per the React "adjust state on prop change"
  // pattern, which avoids a cascading re-render.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(isoDateToDate(value));
    }
  }

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
        themeVariant={theme.name}
        value={draft}
      />
    );
  }

  const sheet = (
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
          themeVariant={theme.name}
          value={draft}
        />
      </Pressable>
    </Pressable>
  );

  // FullWindowOverlay matches the filters bottom sheet container so the picker
  // layers above it. RN Modal alone renders underneath that overlay on iOS.
  if (Platform.OS === "ios") {
    return <FullWindowOverlay>{sheet}</FullWindowOverlay>;
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      {sheet}
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
