import type { ReactNode } from "react";

import { Platform, View, type ViewStyle } from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet as UnistylesStyleSheet } from "react-native-unistyles";

export const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 : 56;

/** Bottom padding for tab-root ScrollViews so content clears the native tab bar. */
export function useTabScrollPadding(extra = 24): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + extra;
}

type TabScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function TabScreen({ children, style }: TabScreenProps) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = UnistylesStyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
}));
