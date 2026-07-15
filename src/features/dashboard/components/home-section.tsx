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

export function HomeCarouselPagination({
  activeIndex,
  count,
}: {
  activeIndex: number;
  count: number;
}) {
  if (count <= 1) return null;

  const currentIndex = Math.min(activeIndex, count - 1);

  return (
    <View accessibilityLabel={`Page ${currentIndex + 1} of ${count}`} style={styles.pagination}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[styles.paginationDot, index === currentIndex && styles.paginationDotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: 10,
  },
  pagination: {
    minHeight: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.placeholder,
  },
  paginationDotActive: {
    width: 14,
    backgroundColor: theme.colors.primary,
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
}));
