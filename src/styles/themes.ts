import { statusColors } from "./tokens";

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

export const lightTheme = {
  colors: {
    background: "#F7F5F1",
    surface: "#EFEFEC",
    card: "#FFFFFF",
    text: "#1A1A18",
    muted: "#8A8A82",
    mutedLight: "#B8B8B0",
    placeholder: "#C8C8C0",
    primary: "#1A3A2A",
    primaryForeground: "#FFFFFF",
    border: "rgba(0, 0, 0, 0.06)",
    borderStrong: "rgba(0, 0, 0, 0.08)",
    icon: "#4A4A42",
    danger: "#DC2626",
    success: "#16A34A",
    warning: "#D97706",
    status: statusColors,
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

export type AppTheme = typeof lightTheme;

export const appThemes = {
  light: lightTheme,
} as const;
