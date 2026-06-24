import { StyleSheet } from "react-native-unistyles";

import { type AppTheme, appThemes } from "./themes";

StyleSheet.configure({
  themes: appThemes,
  settings: {
    initialTheme: "light",
  },
});

type AppThemes = {
  light: AppTheme;
};

declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation requires an interface
  export interface UnistylesThemes extends AppThemes {}
}
