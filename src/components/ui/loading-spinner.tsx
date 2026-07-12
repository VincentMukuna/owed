import { ActivityIndicator, View, type ViewStyle } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

type LoadingSpinnerProps = {
  style?: ViewStyle;
};

export function LoadingSpinner({ style }: LoadingSpinnerProps) {
  const { theme } = useUnistyles();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator color={theme.colors.primary} size="small" />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 180,
    backgroundColor: theme.colors.background,
  },
}));
