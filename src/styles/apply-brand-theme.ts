import { UnistylesRuntime } from "react-native-unistyles";

import {
  type BrandColorThemeId,
  buildBrandColorOverrides,
  getBrandColorTheme,
} from "./brand-themes";
import { type AppTheme, appThemes } from "./themes";

function mergeBrandIntoTheme(theme: AppTheme, brandId: BrandColorThemeId): AppTheme {
  const brand = getBrandColorTheme(brandId);
  const brandColors = buildBrandColorOverrides(brand, theme.name);

  return {
    ...theme,
    colors: {
      ...theme.colors,
      primary: brandColors.primary,
      primaryPressed: brandColors.primaryPressed,
      primaryForeground: brandColors.primaryForeground,
      primarySoft: brandColors.primarySoft,
      primaryMuted: brandColors.primaryMuted,
      primaryBorder: brandColors.primaryBorder,
      accent: brandColors.accent,
      tint: brandColors.tint,
      focus: brandColors.focus,
      selection: brandColors.selection,
      active: brandColors.active,
      fab: brandColors.fab,
      tabActive: brandColors.tabActive,
      selectedBorder: brandColors.selectedBorder,
      progressFill: brandColors.progressFill,
      hero: brandColors.hero,
      avatarTintBg: brandColors.avatarTintBg,
      avatarTintText: brandColors.avatarTintText,
      personAddBg: brandColors.personAddBg,
      personAddPressedBg: brandColors.personAddPressedBg,
      personAddText: brandColors.personAddText,
    },
  };
}

export function createBrandedAppThemes(brandId: BrandColorThemeId) {
  return {
    light: mergeBrandIntoTheme(appThemes.light, brandId),
    dark: mergeBrandIntoTheme(appThemes.dark, brandId),
  } as const;
}

export function applyBrandColorTheme(brandId: BrandColorThemeId): void {
  (["light", "dark"] as const).forEach((themeName) => {
    UnistylesRuntime.updateTheme(themeName, (current) =>
      mergeBrandIntoTheme(current as AppTheme, brandId),
    );
  });
}
