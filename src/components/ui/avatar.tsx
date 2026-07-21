import { View } from "react-native";

import { Check } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import type { CardDebtStatus } from "@/features/debts/view-models";

import { Text } from "./text";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  initials: string;
  status: CardDebtStatus;
  size?: AvatarSize;
  /** 0–100. Renders a ring around the avatar without changing row height. */
  progress?: number;
};

const AVATAR_SIZES: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

const STROKE_WIDTHS: Record<AvatarSize, number> = {
  sm: 2,
  md: 2.5,
  lg: 3,
};

const CHECK_BADGE_SIZES: Record<AvatarSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

const CHECK_ICON_SIZES: Record<AvatarSize, number> = {
  sm: 9,
  md: 10,
  lg: 12,
};

export function Avatar({ initials, status, size = "md", progress }: AvatarProps) {
  const { theme } = useUnistyles();
  const colors = theme.colors.status[status];
  const avatarSize = AVATAR_SIZES[size];
  const strokeWidth = STROKE_WIDTHS[size];
  const clampedProgress = Math.min(100, Math.max(0, progress ?? 0));
  const showProgress = progress !== undefined && clampedProgress > 0 && clampedProgress < 100;
  const isPaid = status === "paid";
  const frameSize = showProgress ? avatarSize + strokeWidth * 2 : avatarSize;
  const radius = avatarSize / 2 + strokeWidth / 2;
  const center = frameSize / 2;
  const circumference = 2 * Math.PI * radius;
  const checkBadgeSize = CHECK_BADGE_SIZES[size];
  const checkIconSize = CHECK_ICON_SIZES[size];

  styles.useVariants({ size });

  return (
    <View style={[styles.frame, { width: frameSize, height: frameSize }]}>
      {showProgress ? (
        <Svg height={frameSize} style={styles.ring} width={frameSize}>
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={theme.colors.surfaceMuted}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={theme.colors.progressFill}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - clampedProgress / 100)}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
      ) : null}
      <View style={[styles.avatar, { backgroundColor: colors.avatarBg }]}>
        <Text style={[styles.initials, { color: colors.avatarText }]}>{initials}</Text>
      </View>
      {isPaid ? (
        <View
          style={[
            styles.checkBadge,
            {
              width: checkBadgeSize,
              height: checkBadgeSize,
              borderRadius: checkBadgeSize / 2,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.paidBorder,
            },
          ]}
        >
          <Check color={theme.colors.success} size={checkIconSize} strokeWidth={3} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  frame: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,

    variants: {
      size: {
        sm: { width: 32, height: 32 },
        md: { width: 40, height: 40 },
        lg: { width: 56, height: 56 },
      },
    },
  },
  initials: {
    fontWeight: "700",

    variants: {
      size: {
        sm: { fontSize: 12 },
        md: { fontSize: 14 },
        lg: { fontSize: 18 },
      },
    },
  },
  checkBadge: {
    position: "absolute",
    right: -1,
    bottom: -1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
}));
