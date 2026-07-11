import { Linking, Platform, ScrollView, View } from "react-native";

import Constants from "expo-constants";
import { Image } from "expo-image";
import { Stack } from "expo-router";

import { FileText, Lock } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import {
  SettingsCard,
  SettingsDetailRow,
  SettingsNavRow,
  SettingsSection,
} from "@/features/settings/components/settings-ui";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "@/features/settings/lib/legal-links";
import { selectionChange } from "@/lib/haptics";

const appVersion = Constants.expoConfig?.version ?? "1.0.0";
const platformLabel =
  Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : Platform.OS;
const SETTINGS_ICON_SIZE = 18;

export function AboutScreen() {
  const { theme } = useUnistyles();
  const iconColor = theme.colors.text;

  const openUrl = (url: string) => {
    selectionChange();
    void Linking.openURL(url);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "About" }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingsSection>
          <SettingsCard>
            <SettingsNavRow
              label="Terms of use"
              leading={<FileText color={iconColor} size={SETTINGS_ICON_SIZE} strokeWidth={2} />}
              onPress={() => openUrl(TERMS_OF_USE_URL)}
            />
            <SettingsNavRow
              bordered
              label="Privacy policy"
              leading={<Lock color={iconColor} size={SETTINGS_ICON_SIZE} strokeWidth={2} />}
              onPress={() => openUrl(PRIVACY_POLICY_URL)}
            />
            <SettingsDetailRow
              bordered
              description={appVersion}
              label={`Owed for ${platformLabel}`}
              leading={
                <Image
                  contentFit="cover"
                  source={require("../../../../assets/images/icon.png")}
                  style={styles.appIcon}
                />
              }
            />
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  appIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
}));
