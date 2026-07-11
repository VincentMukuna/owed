import { Linking } from "react-native";

import Constants from "expo-constants";

import { selectionChange } from "@/lib/haptics";

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

export function reportAppIssue() {
  selectionChange();
  const subject = encodeURIComponent("Owed Issue Report");
  const body = encodeURIComponent(`App version: ${appVersion}\n\nDescribe the issue:\n`);
  void Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
}
