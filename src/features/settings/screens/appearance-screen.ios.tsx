import { useCallback, useRef } from "react";

import { View } from "react-native";

import { Stack } from "expo-router";

import { Picker, Text } from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  listRowBackground,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import {
  saveBrandColorTheme,
  saveThemePreference,
} from "@/features/reminders/lib/reminder-storage";
import {
  AccentColorSheet,
  type AccentColorSheetRef,
} from "@/features/settings/components/accent-color-sheet";
import {
  SettingsSwiftList,
  SettingsSwiftNavRow,
  SettingsSwiftSection,
} from "@/features/settings/components/settings-swift-list.ios";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { selectionChange } from "@/lib/haptics";
import { type BrandColorThemeDefinition, getBrandColorTheme } from "@/styles/brand-themes";
import type { ThemePreference } from "@/styles/themes";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "Light", value: "light" },
  { label: "Auto", value: "auto" },
  { label: "Dark", value: "dark" },
];

export function AppearanceScreen() {
  const { theme } = useUnistyles();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const brandColorTheme = useSettingsStore((state) => state.brandColorTheme);
  const accentColorSheetRef = useRef<AccentColorSheetRef>(null);

  const brandColorLabel = getBrandColorTheme(brandColorTheme).name;

  const handleThemeSelect = useCallback(async (preference: ThemePreference) => {
    selectionChange();
    await saveThemePreference(preference);
  }, []);

  const handleBrandSelect = useCallback(async (brandId: BrandColorThemeDefinition["id"]) => {
    await saveBrandColorTheme(brandId);
  }, []);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Appearance" }} />

      <SettingsSwiftList>
        <SettingsSwiftSection>
          <Picker
            label="Theme"
            onSelectionChange={(value) => {
              void handleThemeSelect(value as ThemePreference);
            }}
            selection={themePreference}
            modifiers={[
              pickerStyle("menu"),
              listRowBackground(theme.colors.card),
              font({ size: 14, weight: "medium" }),
              foregroundStyle(theme.colors.text),
            ]}
          >
            {THEME_OPTIONS.map((option) => (
              <Text key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </Text>
            ))}
          </Picker>
          <SettingsSwiftNavRow
            onPress={() => {
              selectionChange();
              accentColorSheetRef.current?.present();
            }}
            systemImage="paintpalette"
            title="Accent Color"
            value={brandColorLabel}
          />
        </SettingsSwiftSection>
      </SettingsSwiftList>

      <AccentColorSheet
        onSelect={(brandId) => {
          void handleBrandSelect(brandId);
        }}
        ref={accentColorSheetRef}
        value={brandColorTheme}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
