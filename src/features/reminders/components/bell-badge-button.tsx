import { StyleSheet, Text, View } from "react-native";

import { Bell } from "lucide-react-native";

import { IconButton } from "@/components/shared/icon-button";
import { useUnreadReminderCount } from "@/features/reminders/hooks/use-unread-reminder-count";

type BellBadgeButtonProps = {
  onPress: () => void;
};

export function BellBadgeButton({ onPress }: BellBadgeButtonProps) {
  const { data: unreadCount = 0 } = useUnreadReminderCount();
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <View style={styles.wrap}>
      <IconButton onPress={onPress}>
        <Bell color="#4A4A42" size={16} strokeWidth={1.5} />
      </IconButton>
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: "#F7F5F1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 11,
  },
});
