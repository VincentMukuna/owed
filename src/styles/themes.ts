import {
  DEFAULT_BRAND_COLOR_THEME,
  buildBrandColorOverrides,
  getBrandColorTheme,
} from "./brand-themes";
import { darkStatusColors, lightStatusColors } from "./tokens";

const defaultBrand = getBrandColorTheme(DEFAULT_BRAND_COLOR_THEME);

function withBrandColors<T extends { status: typeof lightStatusColors | typeof darkStatusColors }>(
  neutralColors: T,
  mode: "light" | "dark",
) {
  const brand = buildBrandColorOverrides(defaultBrand, mode);

  return {
    ...neutralColors,
    primary: brand.primary,
    primaryPressed: brand.primaryPressed,
    primaryForeground: brand.primaryForeground,
    primarySoft: brand.primarySoft,
    primaryMuted: brand.primaryMuted,
    primaryBorder: brand.primaryBorder,
    accent: brand.accent,
    tint: brand.tint,
    focus: brand.focus,
    selection: brand.selection,
    active: brand.active,
    fab: brand.fab,
    tabActive: brand.tabActive,
    selectedBorder: brand.selectedBorder,
    progressFill: brand.progressFill,
    hero: brand.hero,
    avatarTintBg: brand.avatarTintBg,
    avatarTintText: brand.avatarTintText,
    personAddBg: brand.personAddBg,
    personAddPressedBg: brand.personAddPressedBg,
    personAddText: brand.personAddText,
  };
}

const sharedTypography = {
  hero: {
    fontSize: 38,
    fontWeight: "700" as const,
    lineHeight: 42,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: "700" as const,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
  amount: {
    fontSize: 34,
    fontWeight: "700" as const,
    lineHeight: 38,
    fontVariant: ["tabular-nums"] as "tabular-nums"[],
  },
  amountSm: {
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 18,
    fontVariant: ["tabular-nums"] as "tabular-nums"[],
  },
};

const neutralLightColors = {
  background: "#F7F5F1",
  surface: "#EFEFEC",
  surfaceMuted: "#E0E0DA",
  card: "#FFFFFF",
  text: "#1A1A18",
  muted: "#8A8A82",
  mutedLight: "#96968E",
  placeholder: "#C8C8C0",
  border: "rgba(0, 0, 0, 0.06)",
  borderStrong: "rgba(0, 0, 0, 0.08)",
  icon: "#4A4A42",
  iconMuted: "#D8D8D0",
  danger: "#DC2626",
  dangerForeground: "#FFFFFF",
  success: "#16A34A",
  warning: "#D97706",
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.35)",
  sheet: "#FBFBF8",
  sheetHandle: "#DDDDD8",
  selected: "#FFFFFF",
  footerGradient: ["rgba(247,245,241,0)", "rgba(247,245,241,0.95)", "#F7F5F1"] as const,
  tabInactive: "#C0C0B8",
  switchTrackOff: "#DDDDD8",
  progressTrack: "#F1F5F9",
  message: "#F7F5F1",
  onPrimarySurfaceMuted: "rgba(255,255,255,0.5)",
  onPrimarySurfaceSubtle: "rgba(255,255,255,0.4)",
  onPrimarySurface: "rgba(255,255,255,0.04)",
  paidSurface: "#ECFDF5",
  paidBorder: "#D1FAE5",
  paidIcon: "#D1FAE5",
  paidTitle: "#065F46",
  paidText: "#059669",
  paidAmount: "#047857",
  paidMuted: "#10B981",
  personNeutralBg: "#ECEBE4",
  personNeutralText: "#4A4A42",
  status: lightStatusColors,
  activity: {
    payment: { bg: "#ECFDF5", text: "#059669" },
    add: { bg: "#F1F5F9", text: "#64748B" },
    paid: { bg: "#ECFDF5", text: "#059669" },
    update: { bg: "#FFF7ED", text: "#C2410C" },
  },
  reminder: {
    due: { bg: "#FEF3C7", text: "#D97706" },
    overdue: { bg: "#FEE2E2", text: "#DC2626" },
  },
  personStatus: {
    overdue: { bg: "#FEF2F2", dot: "#F87171", text: "#DC2626" },
    "due-soon": { bg: "#FFFBEB", dot: "#F59E0B", text: "#B45309" },
    settled: { bg: "#F0FDF4", dot: "#34D399", text: "#15803D" },
  },
} as const;

const neutralDarkColors = {
  background: "#0B0B0C",
  surface: "#151516",
  surfaceMuted: "#232325",
  card: "#1B1B1D",
  text: "#F3F3F0",
  muted: "#A7A7A0",
  mutedLight: "#74746D",
  placeholder: "#686862",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  icon: "#D8DED2",
  iconMuted: "#5E665D",
  danger: "#F87171",
  dangerForeground: "#111111",
  success: "#34D399",
  warning: "#FBBF24",
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.58)",
  sheet: "#111112",
  sheetHandle: "#3A3A3D",
  selected: "#242426",
  footerGradient: ["rgba(11,11,12,0)", "rgba(11,11,12,0.95)", "#0B0B0C"] as const,
  tabInactive: "#74746D",
  switchTrackOff: "#3A3A3D",
  progressTrack: "#29292B",
  message: "#121213",
  onPrimarySurfaceMuted: "rgba(255,255,255,0.62)",
  onPrimarySurfaceSubtle: "rgba(255,255,255,0.5)",
  onPrimarySurface: "rgba(255,255,255,0.045)",
  paidSurface: "#103528",
  paidBorder: "#1C5A43",
  paidIcon: "#164632",
  paidTitle: "#A7F3D0",
  paidText: "#6EE7B7",
  paidAmount: "#A7F3D0",
  paidMuted: "#34D399",
  personNeutralBg: "#29292B",
  personNeutralText: "#DADAD5",
  status: darkStatusColors,
  activity: {
    payment: { bg: "#103528", text: "#6EE7B7" },
    add: { bg: "#1F2937", text: "#CBD5E1" },
    paid: { bg: "#103528", text: "#6EE7B7" },
    update: { bg: "#3A2718", text: "#FDBA74" },
  },
  reminder: {
    due: { bg: "#3B2A10", text: "#FCD34D" },
    overdue: { bg: "#3F171C", text: "#FCA5A5" },
  },
  personStatus: {
    overdue: { bg: "#3F171C", dot: "#F87171", text: "#FCA5A5" },
    "due-soon": { bg: "#3B2A10", dot: "#FBBF24", text: "#FCD34D" },
    settled: { bg: "#103528", dot: "#34D399", text: "#6EE7B7" },
  },
} as const;

export const lightTheme = {
  name: "light" as "light" | "dark",
  colors: {
    ...withBrandColors(neutralLightColors, "light"),
    status: neutralLightColors.status,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 40,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 999,
  },
  typography: sharedTypography,
};

type Widen<T> = T extends string
  ? string
  : T extends readonly [infer A, infer B, infer C]
    ? readonly [Widen<A>, Widen<B>, Widen<C>]
    : T extends object
      ? { [K in keyof T]: K extends "name" ? "light" | "dark" : Widen<T[K]> }
      : T;

export type AppTheme = Widen<typeof lightTheme>;

export const darkTheme: AppTheme = {
  ...lightTheme,
  name: "dark",
  colors: {
    ...withBrandColors(neutralDarkColors, "dark"),
    status: neutralDarkColors.status,
  },
};

export const appThemes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type AppThemeName = keyof typeof appThemes;
export type ThemePreference = AppThemeName | "auto";
