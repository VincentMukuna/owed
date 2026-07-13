import { ScrollView, Switch, Text, View } from "react-native";

import { type Href, Stack, router } from "expo-router";

import { Fingerprint, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Button } from "@/components/ui/button";
import { useBiometricAvailability } from "@/features/app-lock/hooks/use-biometric-availability";
import { lockApp, useAppLockStore } from "@/features/app-lock/store/use-app-lock-store";
import {
  SettingsCard,
  SettingsDetailRow,
  SettingsHelperText,
  SettingsIconTile,
  SettingsNavRow,
  SettingsSection,
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
        {!enabled ? (
          <View style={styles.emptyState}>
            <View style={styles.heroIcon}>
              <ShieldCheck color={theme.colors.primary} size={34} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>Keep Owed private</Text>
            <Text style={styles.emptyBody}>
              Use a four-digit PIN and optional phone biometrics when opening Owed.
            </Text>
            <Button
              fullWidth
              onPress={() => router.push("/app-lock-pin?mode=enable" as Href)}
              size="lg"
            >
              Turn on App Lock
            </Button>
          </View>
        ) : (
          <>
            <SettingsSection>
              <SettingsCard>
                {availability.available ? (
                  <SettingsDetailRow
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
                  bordered={availability.available}
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
              </SettingsCard>
              <SettingsHelperText>
                Owed locks after 30 seconds in the background and on every new launch.
              </SettingsHelperText>
            </SettingsSection>

            <SettingsSection>
              <SettingsCard>
                <SettingsNavRow
                  danger
                  label="Turn off App Lock"
                  onPress={() => router.push(authRoute("disable-lock"))}
                />
              </SettingsCard>
            </SettingsSection>
          </>
        )}
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 48,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
    marginBottom: 8,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyBody: {
    maxWidth: 330,
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 16,
  },
}));
