export const lightStatusColors = {
  active: {
    bg: "#F1F5F9",
    text: "#475569",
    dot: "#94A3B8",
    avatarBg: "#F1F5F9",
    avatarText: "#475569",
  },
  "due-soon": {
    bg: "#FFFBEB",
    text: "#B45309",
    dot: "#FBBF24",
    avatarBg: "#FFFBEB",
    avatarText: "#B45309",
  },
  overdue: {
    bg: "#FEF2F2",
    text: "#DC2626",
    dot: "#F87171",
    avatarBg: "#FEF2F2",
    avatarText: "#DC2626",
  },
  partial: {
    bg: "#EEF2FF",
    text: "#4F46E5",
    dot: "#818CF8",
    avatarBg: "#EEF2FF",
    avatarText: "#4338CA",
  },
  paid: {
    bg: "#ECFDF5",
    text: "#047857",
    dot: "#34D399",
    avatarBg: "#ECFDF5",
    avatarText: "#047857",
  },
  archived: {
    bg: "#F1F5F9",
    text: "#64748B",
    dot: "#94A3B8",
    avatarBg: "#F1F5F9",
    avatarText: "#64748B",
  },
} as const;

export const darkStatusColors = {
  active: {
    bg: "#1F2937",
    text: "#CBD5E1",
    dot: "#94A3B8",
    avatarBg: "#1F2937",
    avatarText: "#E2E8F0",
  },
  "due-soon": {
    bg: "#3B2A10",
    text: "#FCD34D",
    dot: "#FBBF24",
    avatarBg: "#3B2A10",
    avatarText: "#FDE68A",
  },
  overdue: {
    bg: "#3F171C",
    text: "#FCA5A5",
    dot: "#F87171",
    avatarBg: "#3F171C",
    avatarText: "#FECACA",
  },
  partial: {
    bg: "#27254E",
    text: "#C4B5FD",
    dot: "#A78BFA",
    avatarBg: "#27254E",
    avatarText: "#DDD6FE",
  },
  paid: {
    bg: "#103528",
    text: "#6EE7B7",
    dot: "#34D399",
    avatarBg: "#103528",
    avatarText: "#A7F3D0",
  },
  archived: {
    bg: "#1F2937",
    text: "#CBD5E1",
    dot: "#94A3B8",
    avatarBg: "#1F2937",
    avatarText: "#CBD5E1",
  },
} as const;

export const statusColors = lightStatusColors;
