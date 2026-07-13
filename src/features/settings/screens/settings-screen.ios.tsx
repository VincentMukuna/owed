import type { ComponentType } from "react";

import { Text, View } from "react-native";

import { type Href, router } from "expo-router";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { TabScreen, useTabScrollPadding } from "@/components/navigation/tab-screen";
import { useAppLockStore } from "@/features/app-lock/store/use-app-lock-store";
import {
  SettingsSwiftList,
  SettingsSwiftNavRow,
  SettingsSwiftSection,
} from "@/features/settings/components/settings-swift-list.ios";
import { useCurrentCurrency } from "@/features/settings/hooks/use-change-currency";
import { useGetHelpActions } from "@/features/settings/hooks/use-get-help-actions";
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

export function SettingsScreen() {
  useUnistyles();
  const tabScrollPadding = useTabScrollPadding();
  const defaultCurrency = useCurrentCurrency();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const brandColorTheme = useSettingsStore((state) => state.brandColorTheme);
  const defaultReminderTime = useSettingsStore((state) => state.defaultReminderTime);
  const appLockEnabled = useAppLockStore((state) => state.enabled);
  const { handleAboutPress, handleHelpCenterPress, handleShareFeedbackPress } = useGetHelpActions();

  const brandColorLabel = getBrandColorTheme(brandColorTheme).name;
  const appearanceSummary = `${THEME_LABELS[themePreference]} · ${brandColorLabel}`;

  return (
    <TabScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <SettingsSwiftList bottomInset={tabScrollPadding}>
        <SettingsSwiftSection title="General">
          <SettingsSwiftNavRow
            iconBackgroundColor="#7C3AED"
            onPress={() => router.push("/appearance" as Href)}
            systemImage="circle.lefthalf.filled"
            title="Appearance"
            value={appearanceSummary}
          />
          <SettingsSwiftNavRow
            iconBackgroundColor="#059669"
            onPress={() => {
              selectionChange();
              router.push("/currency" as Href);
            }}
            systemImage="dollarsign.arrow.circlepath"
            title="Currency"
            value={defaultCurrency}
          />
          <SettingsSwiftNavRow
            iconBackgroundColor="#F97316"
            onPress={() => router.push("/reminders-settings" as Href)}
            systemImage="alarm"
            title="Reminders"
            value={formatReminderTimeDisplay(defaultReminderTime)}
          />
          <SettingsSwiftNavRow
            iconBackgroundColor="#334155"
            onPress={() => router.push("/app-lock" as Href)}
            systemImage="lock.shield"
            title="App Lock"
            value={appLockEnabled ? "On" : "Off"}
          />
        </SettingsSwiftSection>

        <SettingsSwiftSection title="Data">
          <SettingsSwiftNavRow
            iconBackgroundColor="#2563EB"
            onPress={() => router.push("/backup-restore" as Href)}
            systemImage="externaldrive"
            title="Backup & Restore"
          />
        </SettingsSwiftSection>

        <SettingsSwiftSection title="Get Help">
          <SettingsSwiftNavRow
            iconBackgroundColor="#DC2626"
            onPress={handleShareFeedbackPress}
            systemImage="square.and.pencil"
            title="Share feedback"
          />
          <SettingsSwiftNavRow
            iconBackgroundColor="#0D9488"
            onPress={handleHelpCenterPress}
            systemImage="questionmark.circle"
            title="Help Center"
          />
          <SettingsSwiftNavRow
            iconBackgroundColor="#64748B"
            onPress={handleAboutPress}
            systemImage="info.circle"
            title="About"
          />
        </SettingsSwiftSection>

        {DevToolsSection ? <DevToolsSection /> : null}
      </SettingsSwiftList>
    </TabScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
}));
