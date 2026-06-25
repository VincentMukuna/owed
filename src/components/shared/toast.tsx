import { useEffect } from "react";

import { Text, View } from "react-native";

import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import { useUiStore } from "@/features/debts/store/ui-store";

type ToastProps = {
  bottomOffset?: number;
};

export function Toast({ bottomOffset = 90 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const toast = useUiStore((s) => s.toast);

  useEffect(() => {
    return () => useUiStore.getState().clearToast();
  }, []);

  if (!toast) return null;

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: bottomOffset + insets.bottom }]}>
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(180)}
        style={styles.toast}
      >
        <Text style={styles.text}>{toast}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    backgroundColor: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    maxWidth: "90%",
  },
  text: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: "600",
  },
}));
