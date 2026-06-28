import { Platform } from "react-native";

import { router } from "expo-router";

import { Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 : 56;
const FAB_GAP = 10;

type FabButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function FabButton({
  onPress = () => router.push("/add-debt"),
  accessibilityLabel = "Add debt",
}: FabButtonProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const bottom = TAB_BAR_HEIGHT + Math.max(insets.bottom, FAB_GAP) + FAB_GAP;

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.91}
      style={[styles.fab, Platform.OS === "ios" ? styles.fabIos : styles.fabAndroid, { bottom }]}
    >
      <Plus
        color={theme.colors.primaryForeground}
        size={Platform.OS === "ios" ? 22 : 24}
        strokeWidth={2.5}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  fab: {
    position: "absolute",
    right: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.fab,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  fabIos: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  fabAndroid: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
}));

/** Extra scroll padding so list content clears the FAB. */
export const FAB_SCROLL_PADDING = 88;
