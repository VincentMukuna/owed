import {
  type ComponentType,
  type ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import { InteractionManager, Platform, Text, View } from "react-native";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  useBottomSheetScrollableCreator,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { Check } from "lucide-react-native";
import { FullWindowOverlay } from "react-native-screens";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ListInsetDivider } from "@/components/shared/list-inset-divider";
import { PressableScale } from "@/components/shared/pressable-scale";
import { selectionChange } from "@/lib/haptics";
import { type BrandColorThemeDefinition, brandColorThemeList } from "@/styles/brand-themes";

const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

export type AccentColorSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type AccentColorSheetProps = {
  value: BrandColorThemeDefinition["id"];
  onSelect: (brandId: BrandColorThemeDefinition["id"]) => void;
};

export const AccentColorSheet = forwardRef<AccentColorSheetRef, AccentColorSheetProps>(
  ({ value, onSelect }, ref) => {
    const { theme } = useUnistyles();
    const sheetRef = useRef<BottomSheetModal>(null);
    const pendingSelectionRef = useRef<BrandColorThemeDefinition["id"] | null>(null);
    const snapPoints = useMemo(() => ["58%"], []);
    const renderScrollComponent = useBottomSheetScrollableCreator();

    useImperativeHandle(
      ref,
      () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const close = useCallback(() => {
      sheetRef.current?.dismiss();
    }, []);

    const selectBrand = useCallback(
      (brandId: BrandColorThemeDefinition["id"]) => {
        if (brandId === value) {
          close();
          return;
        }

        selectionChange();
        pendingSelectionRef.current = brandId;
        close();
      },
      [close, value],
    );

    const handleDismiss = useCallback(() => {
      const brandId = pendingSelectionRef.current;
      pendingSelectionRef.current = null;

      if (!brandId) {
        return;
      }

      InteractionManager.runAfterInteractions(() => {
        onSelect(brandId);
      });
    }, [onSelect]);

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

    const renderItem = useCallback(
      ({ item, index }: { item: BrandColorThemeDefinition; index: number }) => {
        const selected = item.id === value;

        return (
          <View>
            {index > 0 ? <ListInsetDivider leadingInset={20} trailingInset={20} /> : null}
            <PressableScale onPress={() => selectBrand(item.id)} style={styles.brandRow}>
              <View style={styles.brandCopy}>
                <View style={styles.titleRow}>
                  <Text numberOfLines={1} style={styles.brandTitle}>
                    {item.name}
                  </Text>
                  {selected ? (
                    <Check color={theme.colors.primary} size={18} strokeWidth={2.5} />
                  ) : null}
                </View>
                <Text numberOfLines={2} style={styles.brandDescription}>
                  {item.description}
                </Text>
              </View>
              <BrandSwatchStrip palette={item.palette} />
            </PressableScale>
          </View>
        );
      },
      [selectBrand, theme.colors.primary, value],
    );

    const keyExtractor = useCallback((item: BrandColorThemeDefinition) => item.id, []);

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        containerComponent={SHEET_CONTAINER}
        onDismiss={handleDismiss}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Accent Color</Text>
        </View>
        <FlashList
          data={brandColorThemeList}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          renderScrollComponent={renderScrollComponent}
        />
      </BottomSheetModal>
    );
  },
);

AccentColorSheet.displayName = "AccentColorSheet";

function BrandSwatchStrip({ palette }: { palette: BrandColorThemeDefinition["palette"] }) {
  return (
    <View style={styles.swatchStrip}>
      <View style={[styles.swatch, { backgroundColor: palette.primary }]} />
      <View style={[styles.swatch, { backgroundColor: palette.primarySoft }]} />
      <View style={[styles.swatch, { backgroundColor: palette.primaryBorder }]} />
    </View>
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
  headerRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  brandDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.muted,
  },
  swatchStrip: {
    flexDirection: "row",
    alignSelf: "center",
    width: 72,
    height: 28,
    overflow: "hidden",
  },
  swatch: {
    flex: 1,
  },
}));
