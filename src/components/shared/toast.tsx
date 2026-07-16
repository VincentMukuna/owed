import { useEffect } from "react";

import { Text, View } from "react-native";

import { AlertCircle, Check } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { useUiStore } from "@/features/debts/store/ui-store";

type ToastProps = {
  bottomOffset?: number;
};

export function Toast({ bottomOffset = 90 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const toast = useUiStore((s) => s.toast);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    return () => useUiStore.getState().clearToast();
  }, []);

  if (!toast) return null;

  const tone = toast.tone;
  const badgeColor =
    tone === "success" ? theme.colors.success : tone === "error" ? theme.colors.danger : null;
  const entering = reduceMotion
    ? FadeIn.duration(180)
    : FadeInDown.springify().damping(16).stiffness(220).mass(0.7);

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: bottomOffset + insets.bottom }]}>
      <Animated.View
        key={`${toast.message}-${tone}`}
        entering={entering}
        exiting={FadeOut.duration(180)}
        style={styles.toast}
      >
        {badgeColor ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            {tone === "success" ? (
              <Check color="#FFFFFF" size={12} strokeWidth={3} />
            ) : (
              <AlertCircle color="#FFFFFF" size={12} strokeWidth={2.5} />
            )}
          </View>
        ) : null}
        <Text style={styles.text}>{toast.message}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    maxWidth: "90%",
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: "600",
  },
}));
