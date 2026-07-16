import { useEffect, useRef } from "react";

import { View } from "react-native";

import { Check } from "lucide-react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { useUiStore } from "@/features/debts/store/ui-store";

export function SettleCelebration() {
  const { theme } = useUnistyles();
  const reduceMotion = useReducedMotion();
  const token = useUiStore((state) => state.settleCelebrationToken);

  const previousToken = useRef(token);

  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (token === previousToken.current) return;
    previousToken.current = token;

    // Reduced motion still gets the success toast + haptic elsewhere; skip the overlay.
    if (reduceMotion) return;

    checkScale.value = 0;
    checkOpacity.value = 0;
    ringScale.value = 0.4;
    ringOpacity.value = 0;

    checkScale.value = withSequence(
      withTiming(1.15, { duration: 220, easing: Easing.out(Easing.back(2.4)) }),
      withTiming(1, { duration: 140 }),
    );
    checkOpacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(520, withTiming(0, { duration: 220 })),
    );
    ringScale.value = withTiming(2.4, { duration: 760, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withSequence(
      withTiming(0.4, { duration: 90 }),
      withTiming(0, { duration: 640, easing: Easing.out(Easing.cubic) }),
    );
  }, [token, reduceMotion, checkScale, checkOpacity, ringScale, ringOpacity]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View pointerEvents="none" style={styles.host}>
      <Animated.View style={[styles.ring, { borderColor: theme.colors.success }, ringStyle]} />
      <Animated.View style={[styles.badge, { backgroundColor: theme.colors.success }, checkStyle]}>
        <Check color="#FFFFFF" size={40} strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  host: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 3,
  },
}));
