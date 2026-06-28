import { useCallback } from "react";

import { ScrollView, Text, View } from "react-native";

import { Stack } from "expo-router";

import { Check } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { saveBrandColorTheme } from "@/features/reminders/lib/reminder-storage";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { selectionChange } from "@/lib/haptics";
import { type BrandColorThemeDefinition, brandColorThemeList } from "@/styles/brand-themes";

export function BrandColorScreen() {
  const { theme } = useUnistyles();
  const selectedBrandId = useSettingsStore((state) => state.brandColorTheme);

  const handleSelect = useCallback(
    async (brandId: BrandColorThemeDefinition["id"]) => {
      if (brandId === selectedBrandId) {
        return;
      }

      selectionChange();
      await saveBrandColorTheme(brandId);
    },
    [selectedBrandId],
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Brand Color" }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.helper}>
          Choose the accent color used for buttons, tabs, highlights, and selected states.
        </Text>

        <View style={styles.card}>
          {brandColorThemeList.map((brand, index) => {
            const selected = brand.id === selectedBrandId;

            return (
              <PressableScale
                key={brand.id}
                onPress={() => {
                  void handleSelect(brand.id);
                }}
                style={[styles.row, index > 0 && styles.rowBorder]}
              >
                <View style={styles.rowBody}>
                  <View style={styles.titleRow}>
                    <Text style={styles.rowTitle}>{brand.name}</Text>
                    {selected ? (
                      <Check color={theme.colors.primary} size={18} strokeWidth={2.5} />
                    ) : null}
                  </View>
                  <Text style={styles.rowDescription}>{brand.description}</Text>
                </View>
                <BrandSwatchStrip palette={brand.palette} />
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

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
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  helper: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  rowDescription: {
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
