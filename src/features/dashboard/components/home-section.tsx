import type { ReactNode } from "react";

import { Text, View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";

type HomeSectionProps = {
  actionLabel?: string;
  children: ReactNode;
  onActionPress?: () => void;
  title: string;
};

export function HomeSection({ actionLabel, children, onActionPress, title }: HomeSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {actionLabel && onActionPress ? (
          <PressableScale hitSlop={8} onPress={onActionPress}>
            <Text style={styles.action}>{actionLabel}</Text>
          </PressableScale>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function HomeSurface({ children }: { children: ReactNode }) {
  return <View style={styles.surface}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 17,
    paddingHorizontal: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  action: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  surface: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.name === "light" ? theme.colors.borderStrong : theme.colors.border,
    overflow: "hidden",
  },
}));
