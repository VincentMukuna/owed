import { memo } from "react";

import { View } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import type { DebtCardView } from "@/features/debts/view-models";
import { formatCurrency } from "@/lib/utils/formatters";

type DebtCardProps = {
  debt: DebtCardView;
  onPress: () => void;
};

export const DebtCard = memo(({ debt, onPress }: DebtCardProps) => {
  const { theme } = useUnistyles();
  const pct = debt.amount > 0 ? ((debt.amount - debt.remaining) / debt.amount) * 100 : 0;
  const statusColor = theme.colors.status[debt.status].text;

  return (
    <PressableScale onPress={onPress} style={styles.card}>
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
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
              ) : null}
            </View>
            <View style={styles.amountCol}>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.78}
                numberOfLines={1}
                style={styles.amount}
              >
                {formatCurrency(debt.remaining, debt.currency)}
              </Text>
              <Text style={[styles.dueDate, { color: statusColor }]} numberOfLines={1}>
                {debt.dueDate}
              </Text>
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
    paddingVertical: 14,
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
    alignItems: "flex-start",
    gap: 10,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  reason: {
    fontSize: 13,
    lineHeight: 18,
  },
  amountCol: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: "45%",
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  dueDate: {
    fontSize: 12,
    lineHeight: 17,
  },
  progressTrack: {
    width: 68,
    height: 4,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 7,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.progressFill,
    borderRadius: 999,
  },
}));
