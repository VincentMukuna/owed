import type { ReactNode } from "react";

import { StyleSheet } from "react-native";

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

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
