import { InputAccessoryView, Keyboard, Platform, Pressable, Text, View } from "react-native";

import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";

import { StyleSheet } from "react-native-unistyles";

export const KEYBOARD_DONE_ACCESSORY_ID = "keyboard-done-accessory";

type KeyboardDoneAccessoryProps = {
  nativeID?: string;
  label?: string;
};

export function KeyboardDoneAccessory({
  nativeID = KEYBOARD_DONE_ACCESSORY_ID,
  label = "Done",
}: KeyboardDoneAccessoryProps) {
  if (Platform.OS !== "ios") {
    return null;
  }

  const canUseLiquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Dismiss keyboard"
      hitSlop={8}
      onPress={Keyboard.dismiss}
      style={({ pressed }) => [styles.buttonHit, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.bar}>
        {canUseLiquidGlass ? (
          <GlassView isInteractive glassEffectStyle="clear" style={styles.glassButton}>
            {button}
          </GlassView>
        ) : (
          <View style={styles.fallbackButton}>{button}</View>
        )}
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    minHeight: 42,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "transparent",
  },
  glassButton: {
    borderRadius: 999,
    overflow: "hidden",
  },
  fallbackButton: {
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonHit: {
    minHeight: 28,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
  },
}));
