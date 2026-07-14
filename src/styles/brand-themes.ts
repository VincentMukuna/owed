export type BrandColorThemeId =
  | "owedGreen"
  | "indigo"
  | "plum"
  | "warmBronze"
  | "deepRose"
  | "teal"
  | "stone";

export type BrandColorPalette = {
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primaryMuted: string;
  primaryBorder: string;
  accent: string;
  primaryForeground: string;
};

type DarkBrandOverrides = {
  primary?: string;
  primaryPressed?: string;
  primarySoft: string;
  primaryMuted: string;
  primaryBorder: string;
  hero: string;
  avatarTintBg: string;
  avatarTintText: string;
  selection: string;
  selectedBorder: string;
  personAddText?: string;
};

export type BrandColorThemeDefinition = {
  id: BrandColorThemeId;
  name: string;
  description: string;
  palette: BrandColorPalette;
  dark: DarkBrandOverrides;
};

export const DEFAULT_BRAND_COLOR_THEME: BrandColorThemeId = "owedGreen";

export const brandColorThemes: Record<BrandColorThemeId, BrandColorThemeDefinition> = {
  owedGreen: {
    id: "owedGreen",
    name: "Owwed Green",
    description: "Calm, trustworthy, classic Owwed feel.",
    palette: {
      primary: "#1A3A2A",
      primaryPressed: "#142016",
      primarySoft: "#EAF0EC",
      primaryMuted: "#D6E3DA",
      primaryBorder: "#B8D4C4",
      accent: "#2F7D50",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primary: "#2F7D50",
      primaryPressed: "#142016",
      primarySoft: "#18241D",
      primaryMuted: "#203126",
      primaryBorder: "rgba(167, 243, 208, 0.35)",
      hero: "#0F1812",
      avatarTintBg: "#18241D",
      avatarTintText: "#A7F3D0",
      selection: "#18241D",
      selectedBorder: "rgba(72, 187, 120, 0.32)",
      personAddText: "#A7F3D0",
    },
  },
  indigo: {
    id: "indigo",
    name: "Indigo",
    description: "Clear, confident, product-forward.",
    palette: {
      primary: "#253A8A",
      primaryPressed: "#172554",
      primarySoft: "#EEF2FF",
      primaryMuted: "#E0E7FF",
      primaryBorder: "#C7D2FE",
      accent: "#4F46E5",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primarySoft: "#1E1B4B",
      primaryMuted: "#312E81",
      primaryBorder: "rgba(199, 210, 254, 0.35)",
      hero: "#101C45",
      avatarTintBg: "#1E2A5F",
      avatarTintText: "#C7D2FE",
      selection: "#1E1B4B",
      selectedBorder: "rgba(79, 70, 229, 0.42)",
    },
  },
  plum: {
    id: "plum",
    name: "Plum",
    description: "Rich, creative, slightly luxe.",
    palette: {
      primary: "#5B21B6",
      primaryPressed: "#4C1D95",
      primarySoft: "#EDE9FE",
      primaryMuted: "#DDD6FE",
      primaryBorder: "#C4B5FD",
      accent: "#6D28D9",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primarySoft: "#3B0764",
      primaryMuted: "#581C87",
      primaryBorder: "rgba(196, 181, 253, 0.35)",
      hero: "#2A0548",
      avatarTintBg: "#581C87",
      avatarTintText: "#DDD6FE",
      selection: "#3B0764",
      selectedBorder: "rgba(139, 92, 246, 0.42)",
    },
  },
  warmBronze: {
    id: "warmBronze",
    name: "Warm Bronze",
    description: "Mature, understated, polished.",
    palette: {
      primary: "#92400E",
      primaryPressed: "#78350F",
      primarySoft: "#FFFBEB",
      primaryMuted: "#FEF3C7",
      primaryBorder: "#FDE68A",
      accent: "#B45309",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primarySoft: "#451A03",
      primaryMuted: "#78350F",
      primaryBorder: "rgba(253, 230, 138, 0.35)",
      hero: "#321302",
      avatarTintBg: "#78350F",
      avatarTintText: "#FDE68A",
      selection: "#451A03",
      selectedBorder: "rgba(180, 83, 9, 0.42)",
    },
  },
  deepRose: {
    id: "deepRose",
    name: "Deep Rose",
    description: "Opinionated, memorable, slightly bold.",
    palette: {
      primary: "#9F1239",
      primaryPressed: "#881337",
      primarySoft: "#FFF1F2",
      primaryMuted: "#FFE4E6",
      primaryBorder: "#FECDD3",
      accent: "#BE123C",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primarySoft: "#4C0519",
      primaryMuted: "#5C0A1F",
      primaryBorder: "rgba(254, 205, 211, 0.35)",
      hero: "#350412",
      avatarTintBg: "#5C0A1F",
      avatarTintText: "#FDA4AF",
      selection: "#4C0519",
      selectedBorder: "rgba(190, 18, 60, 0.42)",
    },
  },
  teal: {
    id: "teal",
    name: "Teal",
    description: "Calm, modern, and polished.",
    palette: {
      primary: "#0F766E",
      primaryPressed: "#115E59",
      primarySoft: "#CCFBF1",
      primaryMuted: "#99F6E4",
      primaryBorder: "#5EEAD4",
      accent: "#14B8A6",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primarySoft: "#042F2E",
      primaryMuted: "#134E4A",
      primaryBorder: "rgba(94, 234, 212, 0.35)",
      hero: "#032221",
      avatarTintBg: "#134E4A",
      avatarTintText: "#5EEAD4",
      selection: "#042F2E",
      selectedBorder: "rgba(20, 184, 166, 0.42)",
    },
  },
  stone: {
    id: "stone",
    name: "Stone",
    description: "Minimal, neutral, mature.",
    palette: {
      primary: "#44403C",
      primaryPressed: "#292524",
      primarySoft: "#F5F5F4",
      primaryMuted: "#E7E5E4",
      primaryBorder: "#D6D3D1",
      accent: "#57534E",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primarySoft: "#292524",
      primaryMuted: "#44403C",
      primaryBorder: "rgba(214, 211, 209, 0.35)",
      hero: "#1C1917",
      avatarTintBg: "#44403C",
      avatarTintText: "#D6D3D1",
      selection: "#292524",
      selectedBorder: "rgba(87, 83, 78, 0.42)",
    },
  },
};

export const brandColorThemeList = Object.values(brandColorThemes);

export function getBrandColorTheme(id: BrandColorThemeId): BrandColorThemeDefinition {
  return brandColorThemes[id];
}

function hexChannel(value: string): number {
  return Number.parseInt(value, 16);
}

function primaryBorderAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = hexChannel(normalized.slice(0, 2));
  const g = hexChannel(normalized.slice(2, 4));
  const b = hexChannel(normalized.slice(4, 6));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type BrandColorOverrides = {
  primary: string;
  primaryPressed: string;
  primaryForeground: string;
  primarySoft: string;
  primaryMuted: string;
  primaryBorder: string;
  accent: string;
  tint: string;
  focus: string;
  selection: string;
  active: string;
  fab: string;
  tabActive: string;
  selectedBorder: string;
  progressFill: string;
  hero: string;
  avatarTintBg: string;
  avatarTintText: string;
  personAddBg: string;
  personAddPressedBg: string;
  personAddText: string;
};

export function buildBrandColorOverrides(
  brand: BrandColorThemeDefinition,
  mode: "light" | "dark",
): BrandColorOverrides {
  const { palette, dark } = brand;
  const isDark = mode === "dark";

  if (!isDark) {
    return {
      primary: palette.primary,
      primaryPressed: palette.primaryPressed,
      primaryForeground: palette.primaryForeground,
      primarySoft: palette.primarySoft,
      primaryMuted: palette.primaryMuted,
      primaryBorder: palette.primaryBorder,
      accent: palette.accent,
      tint: palette.primary,
      focus: palette.primary,
      selection: palette.primarySoft,
      active: palette.primaryPressed,
      fab: palette.primary,
      tabActive: palette.primary,
      selectedBorder: primaryBorderAlpha(palette.primary, 0.25),
      progressFill: palette.accent,
      hero: palette.primaryPressed,
      avatarTintBg: palette.primarySoft,
      avatarTintText: palette.primary,
      personAddBg: palette.primarySoft,
      personAddPressedBg: palette.primaryMuted,
      personAddText: palette.primaryPressed,
    };
  }

  const primary = dark.primary ?? palette.primary;
  const primaryPressed = dark.primaryPressed ?? palette.primaryPressed;

  return {
    primary,
    primaryPressed,
    primaryForeground: palette.primaryForeground,
    primarySoft: dark.primarySoft,
    primaryMuted: dark.primaryMuted,
    primaryBorder: dark.primaryBorder,
    accent: palette.accent,
    tint: palette.accent,
    focus: palette.accent,
    selection: dark.selection,
    active: primaryPressed,
    fab: primary,
    tabActive: palette.accent,
    selectedBorder: dark.selectedBorder,
    progressFill: palette.accent,
    hero: dark.hero,
    avatarTintBg: dark.avatarTintBg,
    avatarTintText: dark.avatarTintText,
    personAddBg: dark.primarySoft,
    personAddPressedBg: dark.primaryMuted,
    personAddText: dark.personAddText ?? dark.avatarTintText,
  };
}
