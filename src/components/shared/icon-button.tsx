import type { ReactNode } from "react";

import { StyleSheet } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";

type IconButtonProps = {
  onPress?: () => void;
  children: ReactNode;
};

export function IconButton({ onPress, children }: IconButtonProps) {
  return (
    <PressableScale onPress={onPress} style={styles.button}>
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
}));
