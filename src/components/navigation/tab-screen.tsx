import type { ReactNode } from "react";

import { StyleSheet, View, type ViewStyle } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { APP_BACKGROUND } from "@/lib/navigation/stack-options";

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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  content: {
    flex: 1,
  },
});
