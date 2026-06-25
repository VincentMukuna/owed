import { memo } from "react";

import { Text, View } from "react-native";

import { Bell } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import type { ReminderInboxView } from "@/features/reminders/lib/fetch-reminders";

type NotificationRowProps = {
  item: ReminderInboxView;
  onPress: (debtId: string) => void;
};

export const NotificationRow = memo(({ item, onPress }: NotificationRowProps) => {
  const { theme } = useUnistyles();
  const config = theme.colors.reminder[item.type];

  return (
    <PressableScale onPress={() => onPress(item.debtId)} style={styles.row}>
      <View style={[styles.icon, { backgroundColor: config.bg }]}>
        <Bell color={config.text} size={14} strokeWidth={2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </PressableScale>
  );
});

NotificationRow.displayName = "NotificationRow";

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  body: {
    fontSize: 13,
    color: theme.colors.icon,
    lineHeight: 18,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    marginTop: 2,
    flexShrink: 0,
  },
}));
