import { View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

import type { CardDebtStatus } from "@/features/debts/view-models";

import { Text } from "./text";

type AvatarProps = {
  initials: string;
  status: CardDebtStatus;
  size?: "sm" | "md" | "lg";
};

export function Avatar({ initials, status, size = "md" }: AvatarProps) {
  styles.useVariants({ status, size });

  return (
    <View style={styles.avatar}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,

    variants: {
      size: {
        sm: { width: 32, height: 32 },
        md: { width: 40, height: 40 },
        lg: { width: 56, height: 56 },
      },
      status: {
        active: {
          backgroundColor: theme.colors.status.active.avatarBg,
        },
        "due-soon": {
          backgroundColor: theme.colors.status["due-soon"].avatarBg,
        },
        overdue: {
          backgroundColor: theme.colors.status.overdue.avatarBg,
        },
        partial: {
          backgroundColor: theme.colors.status.partial.avatarBg,
        },
        paid: {
          backgroundColor: theme.colors.status.paid.avatarBg,
        },
      },
    },
  },
  initials: {
    fontWeight: "700",

    variants: {
      size: {
        sm: { fontSize: 12 },
        md: { fontSize: 14 },
        lg: { fontSize: 18 },
      },
      status: {
        active: { color: theme.colors.status.active.avatarText },
        "due-soon": { color: theme.colors.status["due-soon"].avatarText },
        overdue: { color: theme.colors.status.overdue.avatarText },
        partial: { color: theme.colors.status.partial.avatarText },
        paid: { color: theme.colors.status.paid.avatarText },
      },
    },
  },
}));
