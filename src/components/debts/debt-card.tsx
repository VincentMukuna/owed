import { memo } from "react";

import { View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { DebtCardView } from "@/features/debts/view-models";
import { formatCurrency } from "@/lib/utils/formatters";

type DebtCardProps = {
  debt: DebtCardView;
  onPress: () => void;
};

export const DebtCard = memo(({ debt, onPress }: DebtCardProps) => {
  const pct = debt.amount > 0 ? ((debt.amount - debt.remaining) / debt.amount) * 100 : 0;

  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Avatar initials={debt.initials} status={debt.status} />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={styles.meta}>
              <Text style={styles.name}>{debt.name}</Text>
              <Text muted style={styles.reason} numberOfLines={1}>
                {debt.reason}
              </Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.amount}>{formatCurrency(debt.remaining)}</Text>
              <Text muted style={styles.dueDate}>
                {debt.dueDate}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Badge status={debt.status} />
            {debt.status === "partial" ? (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <Text muted style={styles.progressLabel}>
                  {Math.round(pct)}%
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </PressableScale>
  );
});

DebtCard.displayName = "DebtCard";

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  reason: {
    fontSize: 12,
    marginTop: 2,
  },
  amountCol: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  dueDate: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    width: 64,
    height: 4,
    backgroundColor: theme.colors.progressTrack,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.progressFill,
    borderRadius: 999,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
}));
