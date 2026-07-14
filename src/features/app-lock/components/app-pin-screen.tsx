import { useEffect } from "react";

import { AccessibilityInfo, Pressable, Text, View, useWindowDimensions } from "react-native";

import {
  ChevronLeft,
  Delete,
  Fingerprint,
  LockKeyhole,
  ScanFace,
  Wallet,
} from "lucide-react-native";
import Animated, {
  ZoomIn,
  ZoomOut,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import type { BiometricAvailability } from "@/features/app-lock/types";

const PIN_LENGTH = 4;
const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

type AppPinScreenProps = {
  title: string;
  subtitle?: string;
  value: string;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onBack?: () => void;
  onForgotPin?: () => void;
  forgotPinVisible?: boolean;
  biometricAvailability?: BiometricAvailability;
  trustedDeviceAuthentication?: boolean;
  onBiometric?: () => void;
  showBrandMark?: boolean;
  underNativeHeader?: boolean;
  errorToken?: number;
  countdownErrorToken?: number;
  lockoutSeconds?: number;
  recoveryMessage?: string | null;
};

function BiometricIcon({
  availability,
  trustedDeviceAuthentication,
  color,
}: {
  availability?: BiometricAvailability;
  trustedDeviceAuthentication: boolean;
  color: string;
}) {
  if (availability?.icon === "face") {
    return <ScanFace color={color} size={28} strokeWidth={1.8} />;
  }

  if (availability?.icon === "fingerprint") {
    return <Fingerprint color={color} size={28} strokeWidth={1.8} />;
  }

  if (trustedDeviceAuthentication) {
    return <LockKeyhole color={color} size={26} strokeWidth={1.8} />;
  }

  return <Fingerprint color={color} size={28} strokeWidth={1.8} />;
}

function PinCursor({ reduceMotion }: { reduceMotion: boolean }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }

    opacity.value = withRepeat(withTiming(0.15, { duration: 560 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.pinCursor, animatedStyle]} />;
}

export function AppPinScreen({
  title,
  subtitle,
  value,
  onDigit,
  onDelete,
  onBack,
  onForgotPin,
  forgotPinVisible = false,
  biometricAvailability,
  trustedDeviceAuthentication = false,
  onBiometric,
  showBrandMark = false,
  underNativeHeader = false,
  errorToken = 0,
  countdownErrorToken = 0,
  lockoutSeconds = 0,
  recoveryMessage,
}: AppPinScreenProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const pinShake = useSharedValue(0);
  const countdownShake = useSharedValue(0);
  const errorProgress = useSharedValue(0);
  const compact = height < 720 || width < 360;

  useEffect(() => {
    if (errorToken === 0) {
      return;
    }

    errorProgress.value = 1;
    errorProgress.value = withDelay(190, withTiming(0, { duration: 120 }));
    if (!reduceMotion) {
      pinShake.value = withSequence(
        withTiming(-9, { duration: 45 }),
        withTiming(9, { duration: 70 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 55 }),
      );
    }
  }, [errorProgress, errorToken, pinShake, reduceMotion]);

  useEffect(() => {
    if (countdownErrorToken === 0 || reduceMotion) {
      return;
    }

    countdownShake.value = withSequence(
      withTiming(-7, { duration: 45 }),
      withTiming(7, { duration: 70 }),
      withTiming(-4, { duration: 60 }),
      withTiming(0, { duration: 55 }),
    );
  }, [countdownErrorToken, countdownShake, reduceMotion]);

  const pinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pinShake.value }],
  }));
  const pinErrorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: errorProgress.value,
  }));
  const countdownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: countdownShake.value }],
  }));

  const biometricLabel = trustedDeviceAuthentication
    ? "Use phone security"
    : biometricAvailability?.icon === "face"
      ? "Unlock with face recognition"
      : "Unlock with fingerprint";

  return (
    <SafeAreaView
      edges={underNativeHeader ? ["right", "bottom", "left"] : ["top", "right", "bottom", "left"]}
      style={styles.screen}
    >
      {onBack ? (
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={[styles.backButton, { top: insets.top + 12 }]}
        >
          <ChevronLeft color={theme.colors.text} size={28} strokeWidth={2} />
        </Pressable>
      ) : null}

      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={[styles.intro, compact && styles.introCompact]}>
          {showBrandMark ? (
            <View
              accessibilityLabel="Owwed"
              style={[styles.logoWrap, compact && styles.logoWrapCompact]}
            >
              <Wallet
                color={theme.colors.primaryForeground}
                size={compact ? 24 : 28}
                strokeWidth={1.5}
              />
            </View>
          ) : null}
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <Animated.View
            accessibilityLabel={`${value.length} of ${PIN_LENGTH} digits entered`}
            accessibilityRole="text"
            style={[styles.pinIndicators, pinAnimatedStyle]}
          >
            {Array.from({ length: PIN_LENGTH }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.pinIndicator,
                  compact && styles.pinIndicatorCompact,
                  index < value.length && styles.pinIndicatorFilled,
                  value.length < PIN_LENGTH && index === value.length && styles.pinIndicatorActive,
                ]}
              >
                {index < value.length ? (
                  <Animated.View
                    entering={reduceMotion ? undefined : ZoomIn.duration(90)}
                    exiting={reduceMotion ? undefined : ZoomOut.duration(70)}
                    style={styles.pinIndicatorDot}
                  />
                ) : null}
                {value.length < PIN_LENGTH && index === value.length ? (
                  <PinCursor reduceMotion={reduceMotion} />
                ) : null}
                <Animated.View style={[styles.pinIndicatorError, pinErrorAnimatedStyle]} />
              </View>
            ))}
          </Animated.View>

          {lockoutSeconds > 0 ? (
            <Animated.Text
              accessibilityLiveRegion="polite"
              style={[styles.countdown, countdownAnimatedStyle]}
            >
              Try again in {lockoutSeconds} {lockoutSeconds === 1 ? "second" : "seconds"}
            </Animated.Text>
          ) : (
            <View style={styles.messageSpacer} />
          )}
        </View>

        <View style={styles.keypadArea}>
          <View style={[styles.keypadShell, compact && styles.keypadShellCompact]}>
            <View style={styles.keypad}>
              {KEYPAD_ROWS.map((row) => (
                <View key={row[0]} style={styles.keypadRow}>
                  {row.map((digit) => (
                    <PressableScale
                      accessibilityLabel={digit}
                      accessibilityRole="button"
                      key={digit}
                      onPress={() => onDigit(digit)}
                      scaleTo={0.9}
                      style={styles.key}
                    >
                      <Text style={[styles.keyText, compact && styles.keyTextCompact]}>
                        {digit}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              ))}

              <View style={styles.keypadRow}>
                <View style={styles.key}>
                  {onBiometric ? (
                    <PressableScale
                      accessibilityLabel={biometricLabel}
                      accessibilityRole="button"
                      onPress={onBiometric}
                      scaleTo={0.9}
                      style={styles.key}
                    >
                      <BiometricIcon
                        availability={biometricAvailability}
                        color={theme.colors.primary}
                        trustedDeviceAuthentication={trustedDeviceAuthentication}
                      />
                    </PressableScale>
                  ) : null}
                </View>

                <PressableScale
                  accessibilityLabel="0"
                  accessibilityRole="button"
                  onPress={() => onDigit("0")}
                  scaleTo={0.9}
                  style={styles.key}
                >
                  <Text style={[styles.keyText, compact && styles.keyTextCompact]}>0</Text>
                </PressableScale>

                <View style={styles.key}>
                  <PressableScale
                    accessibilityLabel="Delete digit"
                    accessibilityRole="button"
                    disabled={value.length === 0}
                    onPress={onDelete}
                    scaleTo={0.9}
                    style={styles.key}
                  >
                    <Delete color={theme.colors.icon} size={27} strokeWidth={1.8} />
                  </PressableScale>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.keypadFooter}>
            {forgotPinVisible && onForgotPin ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={onForgotPin}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>Forgot PIN?</Text>
              </Pressable>
            ) : (
              <View style={styles.forgotPlaceholder} />
            )}

            {recoveryMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.recoveryMessage}>
                {recoveryMessage}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function announcePinFeedback(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    position: "absolute",
    zIndex: 2,
    left: 14,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 6,
    justifyContent: "space-between",
  },
  contentCompact: {
    paddingTop: 18,
    paddingBottom: 0,
  },
  intro: {
    alignItems: "center",
    gap: 8,
  },
  introCompact: {
    gap: 4,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoWrapCompact: {
    width: 54,
    height: 54,
    borderRadius: 18,
    marginBottom: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  pinIndicators: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 24,
    paddingBottom: 8,
  },
  pinIndicator: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pinIndicatorCompact: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  pinIndicatorFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  pinIndicatorActive: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  pinIndicatorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  pinCursor: {
    width: 2,
    height: 26,
    borderRadius: 1,
    backgroundColor: theme.colors.primary,
  },
  pinIndicatorError: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.reminder.overdue.bg,
  },
  countdown: {
    minHeight: 24,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  messageSpacer: {
    height: 24,
  },
  keypadArea: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  keypadShell: {
    width: "100%",
    maxWidth: 430,
    flex: 1,
    maxHeight: 360,
    minHeight: 280,
    alignSelf: "center",
    paddingVertical: 10,
  },
  keypadShellCompact: {
    minHeight: 250,
  },
  keypad: {
    flex: 1,
    justifyContent: "space-around",
  },
  keypadFooter: {
    width: "100%",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
  },
  forgotButton: {
    minHeight: 32,
    justifyContent: "center",
  },
  forgotPlaceholder: {
    height: 32,
  },
  forgotText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  recoveryMessage: {
    maxWidth: 320,
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  key: {
    width: "24%",
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  keyText: {
    color: theme.colors.text,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
  },
  keyTextCompact: {
    fontSize: 28,
    lineHeight: 34,
  },
}));
