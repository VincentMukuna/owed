import { type ComponentType, type ReactNode, type RefObject, useCallback, useMemo } from "react";

import { Platform, Text, View } from "react-native";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { FullWindowOverlay } from "react-native-screens";
import { StyleSheet } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";

const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

type ViewOptionsSheetProps = {
  children: ReactNode;
  isDefault: boolean;
  onReset: () => void;
  sheetRef: RefObject<BottomSheetModal | null>;
  snapPoint?: string;
  title?: string;
};

export function ViewOptionsSheet({
  children,
  isDefault,
  onReset,
  sheetRef,
  snapPoint = "62%",
  title = "View options",
}: ViewOptionsSheetProps) {
  const snapPoints = useMemo(() => [snapPoint], [snapPoint]);
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      containerComponent={SHEET_CONTAINER}
      enableDynamicSizing={false}
      handleIndicatorStyle={styles.handle}
      snapPoints={snapPoints}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <PressableScale disabled={isDefault} hitSlop={8} onPress={onReset} style={styles.reset}>
            <Text style={[styles.resetText, isDefault && styles.resetTextDisabled]}>Reset</Text>
          </PressableScale>
        </View>
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  sheetBackground: {
    backgroundColor: theme.colors.sheet,
  },
  handle: {
    backgroundColor: theme.colors.sheetHandle,
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },
  reset: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  resetText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  resetTextDisabled: {
    color: theme.colors.mutedLight,
  },
}));
