import { Pressable } from "react-native";

import { X } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { closeModalScreen } from "@/lib/navigation/close-modal-screen";

type HeaderCloseButtonProps = {
  onPress?: () => void;
};

export function HeaderCloseButton({ onPress = closeModalScreen }: HeaderCloseButtonProps) {
  const { theme } = useUnistyles();

  return (
    <Pressable
      accessibilityLabel="Close"
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={styles.trigger}
    >
      <X color={theme.colors.icon} size={18} strokeWidth={2} />
    </Pressable>
  );
}

export function modalCloseHeaderLeft() {
  return <HeaderCloseButton />;
}

export function modalCloseHeaderRight() {
  return <HeaderCloseButton />;
}

const styles = StyleSheet.create(() => ({
  trigger: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
}));
