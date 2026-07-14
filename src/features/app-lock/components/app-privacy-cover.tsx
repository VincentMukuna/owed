import { Text, View } from "react-native";

import { Wallet } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export function AppPrivacyCover() {
  const { theme } = useUnistyles();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.cover}
    >
      <View style={styles.logoWrap}>
        <Wallet color={theme.colors.primaryForeground} size={28} strokeWidth={1.5} />
      </View>
      <Text style={styles.wordmark}>Owwed</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  cover: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: theme.colors.background,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  wordmark: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
}));
