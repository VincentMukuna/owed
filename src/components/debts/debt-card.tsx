import { memo } from "react";

import { type StyleProp, View, type ViewStyle } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { DEBT_STATUS_LABELS } from "@/features/debts/lib/status-engine";
import type { DebtCardView } from "@/features/debts/view-models";
import { formatCurrency } from "@/lib/utils/formatters";

type DebtCardProps = {
  debt: DebtCardView;
  onPress: () => void;
  showStatusCue?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const DebtCard = memo(({ debt, onPress, showStatusCue = true, style }: DebtCardProps) => {
  const { theme } = useUnistyles();
  const pct = debt.amount > 0 ? ((debt.amount - debt.remaining) / debt.amount) * 100 : 0;
  const statusColors = theme.colors.status[debt.status];

  return (
    <PressableScale onPress={onPress} style={[styles.card, style]}>
      <View style={styles.row}>
        <Avatar initials={debt.initials} status={debt.status} />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={styles.meta}>
              <Text numberOfLines={1} style={styles.name}>
                {debt.name}
              </Text>
              <Text muted style={styles.reason} numberOfLines={1}>
                {debt.reason}
              </Text>
              {debt.status === "partial" ? (
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text muted style={styles.progressText}>
                    {Math.round(pct)}%
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.amountCol}>
              {showStatusCue ? (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                  <Text style={[styles.statusText, { color: statusColors.text }]} numberOfLines={1}>
                    {DEBT_STATUS_LABELS[debt.status]}
                  </Text>
                </View>
              ) : null}
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.78}
                numberOfLines={1}
                style={styles.amount}
              >
                {formatCurrency(debt.remaining)}
              </Text>
              <View style={styles.dueRow}>
                <Text style={styles.dueDate} numberOfLines={1}>
                  {debt.dueDate}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </PressableScale>
  );
});

DebtCard.displayName = "DebtCard";

const styles = StyleSheet.create((theme) => ({
  card: {
    paddingVertical: 12,
    borderColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  reason: {
    fontSize: 12,
    lineHeight: 17,
  },
  amountCol: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: "45%",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
    marginBottom: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  amount: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 21,
    fontVariant: ["tabular-nums"],
  },
  dueRow: {
    alignItems: "flex-end",
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
  },
  dueDate: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.muted,
    lineHeight: 17,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 7,
  },
  progressTrack: {
    width: 68,
    height: 4,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.progressFill,
    borderRadius: 999,
  },
  progressText: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
    fontVariant: ["tabular-nums"],
  },
}));
