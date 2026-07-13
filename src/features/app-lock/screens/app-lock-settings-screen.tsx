import { ScrollView, Switch, View } from "react-native";

import { type Href, Stack, router } from "expo-router";

import { Fingerprint, KeyRound, LockKeyhole } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import { lockApp, useAppLockStore } from "@/features/app-lock/store/use-app-lock-store";
import {
  SettingsCard,
  SettingsDetailRow,
  SettingsIconTile,
  SettingsNavRow,
  SettingsSection,
  SettingsTrailingRow,
} from "@/features/settings/components/settings-ui";
import { selectionChange } from "@/lib/haptics";

function authRoute(action: string): Href {
  return `/app-lock-auth?action=${action}` as Href;
}

export function AppLockSettingsScreen() {
  const { theme } = useUnistyles();
  const enabled = useAppLockStore((state) => state.enabled);
  const biometricsEnabled = useAppLockStore((state) => state.biometricsEnabled);
  const { availability } = useBiometricAvailability();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "App Lock" }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection>
          <SettingsCard>
            <SettingsTrailingRow
              label="Enable App Lock"
              trailing={
                <Switch
                  onValueChange={(next) => {
                    selectionChange();
                    router.push(
                      next ? ("/app-lock-pin?mode=enable" as Href) : authRoute("disable-lock"),
                    );
                  }}
                  thumbColor={theme.colors.primaryForeground}
                  trackColor={{
                    false: theme.colors.switchTrackOff,
                    true: theme.colors.primary,
                  }}
                  value={enabled}
                />
              }
            />
            {enabled ? (
              <>
                {availability.available ? (
                  <SettingsDetailRow
                    bordered
                    label="Biometric Unlock"
                    leading={
                      <SettingsIconTile backgroundColor="#0D9488">
                        <Fingerprint color="#FFFFFF" size={16} strokeWidth={2.2} />
                      </SettingsIconTile>
                    }
                    trailing={
                      <Switch
                        onValueChange={(next) => {
                          selectionChange();
                          router.push(authRoute(next ? "enable-biometrics" : "disable-biometrics"));
                        }}
                        thumbColor={theme.colors.primaryForeground}
                        trackColor={{
                          false: theme.colors.switchTrackOff,
                          true: theme.colors.primary,
                        }}
                        value={biometricsEnabled}
                      />
                    }
                  />
                ) : null}
                <SettingsNavRow
                  bordered
                  label="Change PIN"
                  leading={
                    <SettingsIconTile backgroundColor="#2563EB">
                      <KeyRound color="#FFFFFF" size={16} strokeWidth={2.2} />
                    </SettingsIconTile>
                  }
                  onPress={() => router.push(authRoute("change-pin"))}
                />
                <SettingsNavRow
                  bordered
                  label="Lock now"
                  leading={
                    <SettingsIconTile backgroundColor="#334155">
                      <LockKeyhole color="#FFFFFF" size={16} strokeWidth={2.2} />
                    </SettingsIconTile>
                  }
                  onPress={() => {
                    selectionChange();
                    lockApp({ suppressAutoBiometrics: true });
                  }}
                />
              </>
            ) : null}
          </SettingsCard>
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
}));
