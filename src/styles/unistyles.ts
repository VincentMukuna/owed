import { StyleSheet } from "react-native-unistyles";

import { createBrandedAppThemes } from "./apply-brand-theme";
import { DEFAULT_BRAND_COLOR_THEME } from "./brand-themes";
import { type AppTheme } from "./themes";

const initialThemes = createBrandedAppThemes(DEFAULT_BRAND_COLOR_THEME);

StyleSheet.configure({
  themes: initialThemes,
  settings: {
    initialTheme: "light",
  },
});

type AppThemes = {
  light: AppTheme;
  dark: AppTheme;
};

declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation requires an interface
  export interface UnistylesThemes extends AppThemes {}
}
