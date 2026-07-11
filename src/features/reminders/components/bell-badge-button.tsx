import { Platform, Text, View, useColorScheme } from "react-native";

import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";

import { Bell } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { useUnreadReminderCount } from "@/features/reminders/hooks/use-unread-reminder-count";

type BellBadgeButtonProps = {
  onPress: () => void;
};

export function BellBadgeButton({ onPress }: BellBadgeButtonProps) {
  const { theme } = useUnistyles();
  const colorScheme = useColorScheme();
  const { data: unreadCount = 0 } = useUnreadReminderCount();
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);
  const isDark = theme.name === "dark" || colorScheme === "dark";
  const bellColor = isDark ? "#F3F3F0" : "#1A1A18";
  const canUseLiquidGlass =
    Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const accessibilityLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`
      : "Notifications";

  const content = (
    <>
      <Bell color={bellColor} size={18} strokeWidth={2} />
      {unreadCount > 0 ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </>
  );

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={styles.pressable}
    >
      {canUseLiquidGlass ? (
        <View style={styles.action}>
          <GlassView isInteractive glassEffectStyle="clear" style={styles.glassBackdrop} />
          {content}
        </View>
      ) : (
        <View style={styles.fallbackAction}>{content}</View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    position: "relative",
  },
  action: {
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
  fallbackAction: {
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
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: theme.colors.danger,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.dangerForeground,
    lineHeight: 12,
  },
}));
