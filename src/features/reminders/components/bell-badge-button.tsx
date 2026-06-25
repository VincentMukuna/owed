import { Text, View } from "react-native";

import { Bell } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { IconButton } from "@/components/shared/icon-button";
import { useUnreadReminderCount } from "@/features/reminders/hooks/use-unread-reminder-count";

type BellBadgeButtonProps = {
  onPress: () => void;
};

export function BellBadgeButton({ onPress }: BellBadgeButtonProps) {
  const { theme } = useUnistyles();
  const { data: unreadCount = 0 } = useUnreadReminderCount();
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <View style={styles.wrap}>
      <IconButton onPress={onPress}>
        <Bell color={theme.colors.icon} size={16} strokeWidth={1.5} />
      </IconButton>
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: theme.colors.danger,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.dangerForeground,
    lineHeight: 11,
  },
}));
