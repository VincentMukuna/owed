import type { ReactNode } from "react";

import { Text, View } from "react-native";

import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";

export const HOME_PAGE_PADDING = 20;

type HomeSectionProps = {
  actionLabel?: string;
  children: ReactNode;
  leadingAccessory?: ReactNode;
  onActionPress?: () => void;
  title: string;
};

export function HomeSection({
  actionLabel,
  children,
  leadingAccessory,
  onActionPress,
  title,
}: HomeSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLabelRow}>
          <Text style={styles.title}>{title}</Text>
          {leadingAccessory}
        </View>
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
  progress,
}: {
  activeIndex: number;
  count: number;
  progress: SharedValue<number>;
}) {
  const reduceMotion = useReducedMotion();
  const indicatorStyle = useAnimatedStyle(() => {
    const boundedProgress = Math.max(0, Math.min(progress.value, count - 1));
    const pageFraction = boundedProgress - Math.floor(boundedProgress);
    const stretch = reduceMotion ? 1 : 1 + Math.sin(pageFraction * Math.PI) * 0.45;

    return {
      transform: [{ translateX: boundedProgress * 8 }, { scaleX: stretch }],
    };
  }, [count, reduceMotion]);

  if (count <= 1) return null;

  const currentIndex = Math.min(activeIndex, count - 1);

  return (
    <View
      accessibilityLabel={`Page ${currentIndex + 1} of ${count}`}
      accessibilityRole="adjustable"
      style={styles.pagination}
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.paginationDot} />
      ))}
      <Animated.View style={[styles.paginationIndicator, indicatorStyle]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: 10,
  },
  pagination: {
    minHeight: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    position: "relative",
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.placeholder,
  },
  paginationIndicator: {
    position: "absolute",
    left: -1.5,
    width: 8,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 17,
    paddingHorizontal: 1,
  },
  headerLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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
