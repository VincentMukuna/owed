import { Pressable, StyleSheet, Text } from "react-native";

import { lightImpact } from "@/lib/haptics";
import { HEADER_TINT } from "@/lib/navigation/stack-options";

type HeaderSaveButtonProps = {
  disabled?: boolean;
  label?: string;
  onPress: () => void;
};

export function HeaderSaveButton({
  disabled = false,
  label = "Save",
  onPress,
}: HeaderSaveButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        if (disabled) return;
        lightImpact();
        onPress();
      }}
      style={styles.button}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 4,
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: HEADER_TINT,
  },
  labelDisabled: {
    opacity: 0.35,
  },
});
