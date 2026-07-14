import { Linking, View } from "react-native";

import Constants from "expo-constants";
import { Stack } from "expo-router";

import { StyleSheet } from "react-native-unistyles";

import {
  SettingsSwiftInfoRow,
  SettingsSwiftList,
  SettingsSwiftNavRow,
  SettingsSwiftSection,
} from "@/features/settings/components/settings-swift-list.ios";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "@/features/settings/lib/legal-links";
import { selectionChange } from "@/lib/haptics";

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

export function AboutScreen() {
  const openUrl = (url: string) => {
    selectionChange();
    void Linking.openURL(url);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "About" }} />

      <SettingsSwiftList>
        <SettingsSwiftSection>
          <SettingsSwiftNavRow
            onPress={() => openUrl(TERMS_OF_USE_URL)}
            systemImage="doc.text"
            title="Terms of use"
          />
          <SettingsSwiftNavRow
            onPress={() => openUrl(PRIVACY_POLICY_URL)}
            systemImage="lock"
            title="Privacy policy"
          />
          <SettingsSwiftInfoRow
            subtitle={appVersion}
            systemImage="wallet.pass.fill"
            title="Owwed for iOS"
          />
        </SettingsSwiftSection>
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
