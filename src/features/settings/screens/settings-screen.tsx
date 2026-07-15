import type { ComponentType } from "react";

import { ScrollView, Text, View } from "react-native";

import { type Href, router, useLocalSearchParams } from "expo-router";

import {
  Bell,
  FileSpreadsheet,
  HardDriveDownload,
  Palette,
  ShieldCheck,
  WalletCards,
} from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { TabScreen, useTabScrollPadding } from "@/components/navigation/tab-screen";
import { useAppLockStore } from "@/features/app-lock/store/use-app-lock-store";
import { useExportDebtsCsv } from "@/features/data-export/hooks/use-export-debts-csv";
import { GetHelpSection } from "@/features/settings/components/get-help-section";
import {
  SettingsCard,
  SettingsIconTile,
  SettingsNavRow,
  SettingsSection,
} from "@/features/settings/components/settings-ui";
import { useCurrentCurrency } from "@/features/settings/hooks/use-change-currency";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { formatReminderTimeDisplay } from "@/features/settings/lib/format-reminder-time";
import { selectionChange } from "@/lib/haptics";
import { getBrandColorTheme } from "@/styles/brand-themes";
import type { ThemePreference } from "@/styles/themes";

let DevToolsSection: ComponentType | null = null;

if (__DEV__) {
  // Dev-only require keeps @faker-js/faker out of production bundles.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DevToolsSection = require("@/features/settings/dev/dev-tools-section").DevToolsSection;
}

const THEME_LABELS: Record<ThemePreference, string> = {
  light: "Light",
  auto: "Auto",
  dark: "Dark",
};

const SETTINGS_ICON_SIZE = 16;

export function SettingsScreen() {
  const { screenshotMode } = useLocalSearchParams<{ screenshotMode?: string }>();
  useUnistyles();
  const tabScrollPadding = useTabScrollPadding();
  const defaultCurrency = useCurrentCurrency();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const brandColorTheme = useSettingsStore((state) => state.brandColorTheme);
  const defaultReminderTime = useSettingsStore((state) => state.defaultReminderTime);
  const appLockEnabled = useAppLockStore((state) => state.enabled);
  const { exportDebts, isExporting } = useExportDebtsCsv();

  const brandColorLabel = getBrandColorTheme(brandColorTheme).name;
  const appearanceSummary = `${THEME_LABELS[themePreference]} · ${brandColorLabel}`;

  return (
    <TabScreen>
      <View style={styles.header} testID="settings-screen-ready">
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabScrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="General">
          <SettingsCard>
            <SettingsNavRow
              label="Appearance"
              leading={
                <SettingsIconTile backgroundColor="#7C3AED">
                  <Palette color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
                </SettingsIconTile>
              }
              onPress={() => router.push("/appearance" as Href)}
              value={appearanceSummary}
            />
            <SettingsNavRow
              bordered
              label="Currency"
              leading={
                <SettingsIconTile backgroundColor="#059669">
                  <WalletCards color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
                </SettingsIconTile>
              }
              onPress={() => {
                selectionChange();
                router.push("/currency" as Href);
              }}
              value={defaultCurrency}
            />
            <SettingsNavRow
              bordered
              label="Reminders"
              leading={
                <SettingsIconTile backgroundColor="#F97316">
                  <Bell color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
                </SettingsIconTile>
              }
              onPress={() => router.push("/reminders-settings" as Href)}
              value={formatReminderTimeDisplay(defaultReminderTime)}
            />
            {process.env.EXPO_OS !== "web" ? (
              <SettingsNavRow
                bordered
                label="App Lock"
                leading={
                  <SettingsIconTile backgroundColor="#334155">
                    <ShieldCheck color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
                  </SettingsIconTile>
                }
                onPress={() => router.push("/app-lock" as Href)}
                value={appLockEnabled ? "On" : "Off"}
              />
            ) : null}
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsCard>
            <SettingsNavRow
              busyLabel={isExporting ? "Exporting…" : undefined}
              disabled={isExporting}
              label="Export Data"
              leading={
                <SettingsIconTile backgroundColor="#0D9488">
                  <FileSpreadsheet color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
                </SettingsIconTile>
              }
              onPress={() => {
                void exportDebts();
              }}
              showsChevron={false}
            />
            <SettingsNavRow
              bordered
              label="Backup & Restore"
              leading={
                <SettingsIconTile backgroundColor="#2563EB">
                  <HardDriveDownload color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
                </SettingsIconTile>
              }
              onPress={() => router.push("/backup-restore" as Href)}
            />
          </SettingsCard>
        </SettingsSection>

        <GetHelpSection />

        {DevToolsSection && screenshotMode !== "store" ? <DevToolsSection /> : null}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
}));
