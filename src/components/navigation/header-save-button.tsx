import { Pressable, Text } from "react-native";

import { StyleSheet } from "react-native-unistyles";

import { lightImpact } from "@/lib/haptics";

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

const styles = StyleSheet.create((theme) => ({
  button: {
    paddingHorizontal: 4,
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  labelDisabled: {
    opacity: 0.35,
  },
}));
