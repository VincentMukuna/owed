import type { ReactNode } from "react";

import { Platform, View } from "react-native";

import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";

import { StyleSheet } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";

type IconButtonProps = {
  accessibilityLabel?: string;
  onPress?: () => void;
  children: ReactNode;
};

export function IconButton({ accessibilityLabel, onPress, children }: IconButtonProps) {
  const canUseLiquidGlass =
    Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.pressable}
    >
      {canUseLiquidGlass ? (
        <View style={styles.glassButton}>
          <GlassView isInteractive glassEffectStyle="clear" style={styles.glassBackdrop} />
          {children}
        </View>
      ) : (
        <View style={styles.fallbackButton}>{children}</View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    position: "relative",
  },
  glassButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  glassBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    overflow: "hidden",
  },
  fallbackButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 1,
        blurRadius: 2 * 2,
        color: `rgba(0, 0, 0, ${0.05})`,
      },
    ],
  },
}));
