import { View } from "react-native";

import { type Href, Stack, router } from "expo-router";

import { Toggle } from "@expo/ui/swift-ui";
import { StyleSheet } from "react-native-unistyles";

import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import { lockApp, useAppLockStore } from "@/features/app-lock/store/use-app-lock-store";
import {
  SettingsSwiftList,
  SettingsSwiftNavRow,
  SettingsSwiftSection,
  SettingsSwiftToggleRow,
} from "@/features/settings/components/settings-swift-list.ios";
import { selectionChange } from "@/lib/haptics";

function authRoute(action: string): Href {
  return `/app-lock-auth?action=${action}` as Href;
}

export function AppLockSettingsScreen() {
  const enabled = useAppLockStore((state) => state.enabled);
  const biometricsEnabled = useAppLockStore((state) => state.biometricsEnabled);
  const { availability } = useBiometricAvailability();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "App Lock" }} />

      <SettingsSwiftList>
        <SettingsSwiftSection>
          <Toggle
            isOn={enabled}
            label="Enable App Lock"
            onIsOnChange={(next) => {
              selectionChange();
              router.push(next ? ("/app-lock-pin?mode=enable" as Href) : authRoute("disable-lock"));
            }}
          />
        </SettingsSwiftSection>
        {enabled ? (
          <SettingsSwiftSection>
            {availability.available ? (
              <SettingsSwiftToggleRow
                iconBackgroundColor="#0D9488"
                isOn={biometricsEnabled}
                onIsOnChange={(next) => {
                  selectionChange();
                  router.push(authRoute(next ? "enable-biometrics" : "disable-biometrics"));
                }}
                systemImage="faceid"
                title="Biometric Unlock"
              />
            ) : null}
            <SettingsSwiftNavRow
              iconBackgroundColor="#2563EB"
              onPress={() => router.push(authRoute("change-pin"))}
              systemImage="key"
              title="Change PIN"
            />
            <SettingsSwiftNavRow
              iconBackgroundColor="#334155"
              onPress={() => {
                selectionChange();
                lockApp({ suppressAutoBiometrics: true });
              }}
              showsChevron={false}
              systemImage="lock"
              title="Lock now"
            />
          </SettingsSwiftSection>
        ) : null}
      </SettingsSwiftList>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
