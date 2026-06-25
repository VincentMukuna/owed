import { memo } from "react";

import { StyleSheet, Text, View } from "react-native";

import { Bell } from "lucide-react-native";

import { PressableScale } from "@/components/shared/pressable-scale";
import type { ReminderInboxView } from "@/features/reminders/lib/fetch-reminders";
import type { ReminderType } from "@/types";

const TYPE_CONFIG: Record<ReminderType, { bg: string; color: string }> = {
  due: { bg: "#FEF3C7", color: "#D97706" },
  overdue: { bg: "#FEE2E2", color: "#DC2626" },
};

type NotificationRowProps = {
  item: ReminderInboxView;
  onPress: (debtId: string) => void;
};

export const NotificationRow = memo(({ item, onPress }: NotificationRowProps) => {
  const config = TYPE_CONFIG[item.type];

  return (
    <PressableScale onPress={() => onPress(item.debtId)} style={styles.row}>
      <View style={[styles.icon, { backgroundColor: config.bg }]}>
        <Bell color={config.color} size={14} strokeWidth={2} />
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

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
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
    color: "#1A1A18",
  },
  body: {
    fontSize: 13,
    color: "#4A4A42",
    lineHeight: 18,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: "#B8B8B0",
    marginTop: 2,
    flexShrink: 0,
  },
});
