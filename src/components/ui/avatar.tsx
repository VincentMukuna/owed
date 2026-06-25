import { View } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import type { CardDebtStatus } from "@/features/debts/view-models";

import { Text } from "./text";

type AvatarProps = {
  initials: string;
  status: CardDebtStatus;
  size?: "sm" | "md" | "lg";
};

export function Avatar({ initials, status, size = "md" }: AvatarProps) {
  const { theme } = useUnistyles();
  const colors = theme.colors.status[status];

  styles.useVariants({ size });

  return (
    <View style={[styles.avatar, { backgroundColor: colors.avatarBg }]}>
      <Text style={[styles.initials, { color: colors.avatarText }]}>{initials}</Text>
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
    },
  },
}));
