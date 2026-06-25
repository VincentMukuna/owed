import { View } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import type { CardDebtStatus } from "@/features/debts/view-models";

import { Text } from "./text";

const STATUS_LABELS: Record<CardDebtStatus, string> = {
  active: "Active",
  "due-soon": "Due soon",
  overdue: "Overdue",
  partial: "Partial",
  paid: "Paid",
};

type BadgeProps = {
  status: CardDebtStatus;
};

export function Badge({ status }: BadgeProps) {
  const { theme } = useUnistyles();
  const colors = theme.colors.status[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.label, { color: colors.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
}));
