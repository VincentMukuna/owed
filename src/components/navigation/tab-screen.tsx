import type { ReactNode } from "react";

import { Platform, View, type ViewStyle } from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 : 56;

/** Bottom padding for tab-root ScrollViews so content clears the native tab bar. */
export function useTabScrollPadding(extra = 24): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + extra;
}

type TabScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
};

export function TabScreen({ children, style, testID }: TabScreenProps) {
  const { theme } = useUnistyles();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <View
        collapsable={!testID}
        style={[styles.content, style, { backgroundColor: theme.colors.background }]}
        testID={testID}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(() => ({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
}));
