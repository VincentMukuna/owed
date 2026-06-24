import { View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

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
  styles.useVariants({ status });

  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.label}>{STATUS_LABELS[status]}</Text>
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

    variants: {
      status: {
        active: {
          backgroundColor: theme.colors.status.active.bg,
        },
        "due-soon": {
          backgroundColor: theme.colors.status["due-soon"].bg,
        },
        overdue: {
          backgroundColor: theme.colors.status.overdue.bg,
        },
        partial: {
          backgroundColor: theme.colors.status.partial.bg,
        },
        paid: {
          backgroundColor: theme.colors.status.paid.bg,
        },
      },
    },
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,

    variants: {
      status: {
        active: { backgroundColor: theme.colors.status.active.dot },
        "due-soon": { backgroundColor: theme.colors.status["due-soon"].dot },
        overdue: { backgroundColor: theme.colors.status.overdue.dot },
        partial: { backgroundColor: theme.colors.status.partial.dot },
        paid: { backgroundColor: theme.colors.status.paid.dot },
      },
    },
  },
  label: {
    fontSize: 11,
    fontWeight: "600",

    variants: {
      status: {
        active: { color: theme.colors.status.active.text },
        "due-soon": { color: theme.colors.status["due-soon"].text },
        overdue: { color: theme.colors.status.overdue.text },
        partial: { color: theme.colors.status.partial.text },
        paid: { color: theme.colors.status.paid.text },
      },
    },
  },
}));
