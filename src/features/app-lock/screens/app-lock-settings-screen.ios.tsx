import { View } from "react-native";

import { type Href, Stack, router } from "expo-router";

import { Button } from "@expo/ui/swift-ui";
import { buttonStyle } from "@expo/ui/swift-ui/modifiers";
import { StyleSheet } from "react-native-unistyles";

import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import { lockApp, useAppLockStore } from "@/features/app-lock/store/use-app-lock-store";
import {
  SettingsSwiftBodyText,
  SettingsSwiftDestructiveRow,
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
        {!enabled ? (
          <SettingsSwiftSection footer="Owed will ask for your PIN on every new launch and after 30 seconds in the background.">
            <SettingsSwiftBodyText>
              Keep names, balances, and payment history private with a four-digit PIN and optional
              phone biometrics.
            </SettingsSwiftBodyText>
            <Button
              label="Turn on App Lock"
              modifiers={[buttonStyle("borderedProminent")]}
              onPress={() => router.push("/app-lock-pin?mode=enable" as Href)}
            />
          </SettingsSwiftSection>
        ) : (
          <>
            <SettingsSwiftSection footer="Owed locks after 30 seconds in the background and on every new launch.">
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
                showsChevron
                systemImage="key"
                title="Change PIN"
              />
              <SettingsSwiftNavRow
                iconBackgroundColor="#334155"
                onPress={() => {
                  selectionChange();
                  lockApp({ suppressAutoBiometrics: true });
                }}
                systemImage="lock"
                title="Lock now"
              />
            </SettingsSwiftSection>

            <SettingsSwiftSection>
              <SettingsSwiftDestructiveRow
                onPress={() => router.push(authRoute("disable-lock"))}
                title="Turn off App Lock"
              />
            </SettingsSwiftSection>
          </>
        )}
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
