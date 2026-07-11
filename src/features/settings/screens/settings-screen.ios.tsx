import type { ComponentType } from "react";
import { useCallback, useRef, useState } from "react";

import { Text, View } from "react-native";

import Constants from "expo-constants";
import { type Href, router } from "expo-router";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { TabScreen, useTabScrollPadding } from "@/components/navigation/tab-screen";
import { debtRepository } from "@/features/debts/repositories/debt-repository";
import {
  CurrencyConversionSheet,
  type CurrencyConversionSheetRef,
} from "@/features/settings/components/currency-conversion-sheet";
import {
  CurrencyPickerSheet,
  type CurrencyPickerSheetRef,
} from "@/features/settings/components/currency-picker-sheet";
import {
  SettingsSwiftList,
  SettingsSwiftNavRow,
  SettingsSwiftSection,
} from "@/features/settings/components/settings-swift-list.ios";
import {
  useChangeCurrency,
  useCurrentCurrency,
} from "@/features/settings/hooks/use-change-currency";
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

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

export function SettingsScreen() {
  useUnistyles();
  const tabScrollPadding = useTabScrollPadding();
  const defaultCurrency = useCurrentCurrency();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const brandColorTheme = useSettingsStore((state) => state.brandColorTheme);
  const defaultReminderTime = useSettingsStore((state) => state.defaultReminderTime);
  const changeCurrency = useChangeCurrency();
  const { handleAboutPress, handleHelpCenterPress, handleReportIssue } = useGetHelpActions();
  const currencyPickerRef = useRef<CurrencyPickerSheetRef>(null);
  const conversionSheetRef = useRef<CurrencyConversionSheetRef>(null);

  const [conversionTarget, setConversionTarget] = useState<string | null>(null);
  const [totalRemaining, setTotalRemaining] = useState(0);

  const brandColorLabel = getBrandColorTheme(brandColorTheme).name;
  const appearanceSummary = `${THEME_LABELS[themePreference]} · ${brandColorLabel}`;

  const handleCurrencySelect = useCallback(
    async (code: string) => {
      if (code === defaultCurrency) {
        return;
      }

      const hasDebts = await debtRepository.hasAnyDebts();

      if (!hasDebts) {
        changeCurrency.mutate({
          fromCurrency: defaultCurrency,
          toCurrency: code,
        });
        return;
      }

      const total = await debtRepository.getTotalRemaining();
      setTotalRemaining(total);
      setConversionTarget(code);
      requestAnimationFrame(() => {
        conversionSheetRef.current?.present();
      });
    },
    [changeCurrency, defaultCurrency],
  );

  const handleConversionConfirm = useCallback(
    (rate: number) => {
      if (!conversionTarget) {
        return;
      }

      changeCurrency.mutate(
        {
          fromCurrency: defaultCurrency,
          toCurrency: conversionTarget,
          rate,
        },
        {
          onSuccess: () => {
            conversionSheetRef.current?.dismiss();
            setConversionTarget(null);
          },
        },
      );
    },
    [changeCurrency, conversionTarget, defaultCurrency],
  );

  const handleConversionClose = useCallback(() => {
    if (changeCurrency.isPending) {
      return;
    }

    setConversionTarget(null);
  }, [changeCurrency.isPending]);

  return (
    <BottomSheetModalProvider>
      <TabScreen>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <SettingsSwiftList bottomInset={tabScrollPadding}>
          <SettingsSwiftSection title="General">
            <SettingsSwiftNavRow
              onPress={() => router.push("/appearance" as Href)}
              systemImage="circle.lefthalf.filled"
              title="Appearance"
              value={appearanceSummary}
            />
            <SettingsSwiftNavRow
              onPress={() => {
                selectionChange();
                currencyPickerRef.current?.present();
              }}
              systemImage="dollarsign.arrow.circlepath"
              title="Currency"
              value={defaultCurrency}
            />
            <SettingsSwiftNavRow
              onPress={() => router.push("/reminders-settings" as Href)}
              systemImage="alarm"
              title="Reminders"
              value={formatReminderTimeDisplay(defaultReminderTime)}
            />
          </SettingsSwiftSection>

          <SettingsSwiftSection title="Data">
            <SettingsSwiftNavRow
              onPress={() => router.push("/backup-restore" as Href)}
              systemImage="externaldrive"
              title="Backup & Restore"
            />
          </SettingsSwiftSection>

          <SettingsSwiftSection title="Get Help">
            <SettingsSwiftNavRow
              onPress={handleReportIssue}
              systemImage="flag"
              title="Report an issue"
            />
            <SettingsSwiftNavRow
              onPress={handleHelpCenterPress}
              systemImage="questionmark.circle"
              title="Help Center"
            />
            <SettingsSwiftNavRow
              onPress={handleAboutPress}
              systemImage="info.circle"
              title="About"
            />
          </SettingsSwiftSection>

          {DevToolsSection ? <DevToolsSection /> : null}
        </SettingsSwiftList>

        <CurrencyPickerSheet
          onSelect={(code) => {
            void handleCurrencySelect(code);
          }}
          ref={currencyPickerRef}
          value={defaultCurrency}
        />

        <CurrencyConversionSheet
          fromCurrency={defaultCurrency}
          isSubmitting={changeCurrency.isPending}
          onClose={handleConversionClose}
          onConfirm={handleConversionConfirm}
          ref={conversionSheetRef}
          toCurrency={conversionTarget ?? defaultCurrency}
          totalRemaining={totalRemaining}
        />
      </TabScreen>
    </BottomSheetModalProvider>
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
