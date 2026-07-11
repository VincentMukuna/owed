import { Platform, View } from "react-native";

import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
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
  const canUseLiquidGlass =
    Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.91}
      style={[styles.fab, { bottom }]}
    >
      {canUseLiquidGlass ? (
        <View style={[styles.fabBody, styles.fabIos]}>
          <GlassView
            colorScheme={theme.name}
            glassEffectStyle="regular"
            isInteractive
            style={styles.glassBackdrop}
            tintColor={theme.colors.fab}
          />
          <Plus color={theme.colors.primaryForeground} size={22} strokeWidth={2.7} />
        </View>
      ) : (
        <View
          style={[
            styles.fabBody,
            styles.solidFab,
            Platform.OS === "ios" ? styles.fabIos : styles.fabAndroid,
          ]}
        >
          <Plus
            color={theme.colors.primaryForeground}
            size={Platform.OS === "ios" ? 22 : 24}
            strokeWidth={2.5}
          />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  fab: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  fabBody: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  solidFab: {
    backgroundColor: theme.colors.fab,
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
  glassBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    overflow: "hidden",
  },
}));

/** Extra scroll padding so list content clears the FAB. */
export const FAB_SCROLL_PADDING = 88;
