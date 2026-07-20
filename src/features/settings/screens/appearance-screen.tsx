import { useCallback, useRef } from "react";

import { Platform, ScrollView, Text, View } from "react-native";

import { Stack } from "expo-router";

import { Host, Picker } from "@expo/ui";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import {
  saveBrandColorTheme,
  saveThemePreference,
} from "@/features/reminders/lib/reminder-storage";
import {
  AccentColorSheet,
  type AccentColorSheetRef,
} from "@/features/settings/components/accent-color-sheet";
import {
  SettingsCard,
  SettingsNavRow,
  SettingsSection,
  SettingsTrailingRow,
} from "@/features/settings/components/settings-ui";
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingsSection>
          <SettingsCard>
            <SettingsTrailingRow
              label="Theme"
              trailing={
                <ThemePicker
                  onSelect={(preference) => {
                    void handleThemeSelect(preference);
                  }}
                  themePreference={themePreference}
                />
              }
            />
            <SettingsNavRow
              bordered
              label="Accent Color"
              onPress={() => {
                selectionChange();
                accentColorSheetRef.current?.present();
              }}
              value={brandColorLabel}
            />
          </SettingsCard>
        </SettingsSection>
      </ScrollView>

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

function ThemePicker({
  themePreference,
  onSelect,
}: {
  themePreference: ThemePreference;
  onSelect: (preference: ThemePreference) => void;
}) {
  if (Platform.OS === "android") {
    return <AndroidThemePicker onSelect={onSelect} themePreference={themePreference} />;
  }

  return <IosThemePicker onSelect={onSelect} themePreference={themePreference} />;
}

function IosThemePicker({
  themePreference,
  onSelect,
}: {
  themePreference: ThemePreference;
  onSelect: (preference: ThemePreference) => void;
}) {
  const { theme } = useUnistyles();

  return (
    <Host
      colorScheme={theme.name}
      matchContents={{ horizontal: true, vertical: false }}
      seedColor={theme.colors.muted}
      style={styles.themePickerHost}
    >
      <Picker
        onValueChange={(value) => {
          onSelect(value as ThemePreference);
        }}
        selectedValue={themePreference}
      >
        {THEME_OPTIONS.map((option) => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>
    </Host>
  );
}

function AndroidThemePicker({
  themePreference,
  onSelect,
}: {
  themePreference: ThemePreference;
  onSelect: (preference: ThemePreference) => void;
}) {
  return (
    <View style={styles.themeSegments}>
      {THEME_OPTIONS.map((option) => {
        const selected = option.value === themePreference;

        return (
          <PressableScale
            key={option.value}
            onPress={() => {
              onSelect(option.value);
            }}
            style={[styles.themeSegment, selected && styles.themeSegmentSelected]}
          >
            <Text style={[styles.themeSegmentText, selected && styles.themeSegmentTextSelected]}>
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
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
    gap: 20,
  },
  themePickerHost: {
    height: 22,
    justifyContent: "center",
  },
  themeSegments: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    padding: 2,
    borderRadius: 9,
    backgroundColor: theme.colors.surfaceMuted,
  },
  themeSegment: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  themeSegmentSelected: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  themeSegmentText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  themeSegmentTextSelected: {
    color: theme.colors.text,
  },
}));
