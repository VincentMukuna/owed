import { memo } from "react";

import { type StyleProp, View, type ViewStyle } from "react-native";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { type DebtAction, DebtActionsMenu } from "@/features/debts/components/debt-actions-menu";
import { formatRelativeDay } from "@/features/debts/lib/format-dates";
import type { DebtCardView } from "@/features/debts/view-models";
import { formatCurrency } from "@/lib/utils/formatters";

type DebtCardProps = {
  debt: DebtCardView;
  onPress: () => void;
  onAction?: (action: DebtAction, debt: DebtCardView) => void;
  showDirectionCue?: boolean;
  supportingText?: string;
  supportingTextTone?: "danger" | "warning";
  style?: StyleProp<ViewStyle>;
};

export const DebtCard = memo(
  ({
    debt,
    onPress,
    onAction,
    showDirectionCue = false,
    supportingText,
    supportingTextTone,
    style,
  }: DebtCardProps) => {
    const { theme } = useUnistyles();
    const pct = debt.amount > 0 ? ((debt.amount - debt.remaining) / debt.amount) * 100 : 0;
    const DirectionIcon = debt.direction === "they_owe_me" ? ArrowDownLeft : ArrowUpRight;
    const directionColor =
      debt.direction === "they_owe_me" ? theme.colors.success : theme.colors.danger;

    const content = (
      <PressableScale onPress={onPress} style={[styles.card, style]}>
        <View style={styles.row}>
          <Avatar
            initials={debt.initials}
            progress={debt.status === "partial" ? pct : undefined}
            status={debt.status}
          />
          <View style={styles.body}>
            <View style={styles.topRow}>
              <View style={styles.meta}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.name}>
                    {debt.name}
                  </Text>
                  {showDirectionCue ? (
                    <DirectionIcon
                      color={directionColor}
                      size={14}
                      strokeWidth={2.3}
                      style={styles.directionIcon}
                    />
                  ) : null}
                </View>
                <Text
                  muted
                  style={[
                    styles.subtitle,
                    supportingTextTone === "danger" ? styles.subtitleUrgent : null,
                  ]}
                  numberOfLines={1}
                >
                  {supportingText ?? debt.subtitle ?? debt.reason}
                </Text>
              </View>
              <View style={styles.amountCol}>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                  numberOfLines={1}
                  style={styles.amount}
                >
                  {formatCurrency(
                    debt.status === "paid" ? debt.amount : debt.remaining,
                    debt.currency,
                  )}
                </Text>
                <View style={styles.dueRow}>
                  <Text style={styles.dueDate} numberOfLines={1}>
                    {debt.status === "paid" ? formatPaidWhen(debt.lastPaymentAt) : debt.dueDate}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </PressableScale>
    );

    if (!onAction) {
      return content;
    }

    return (
      <DebtActionsMenu debt={debt} onAction={onAction} openOnLongPress>
        {content}
      </DebtActionsMenu>
    );
  },
);

DebtCard.displayName = "DebtCard";

function formatPaidWhen(lastPaymentAt?: string): string {
  if (!lastPaymentAt) {
    return "Paid";
  }

  const when = formatRelativeDay(lastPaymentAt);
  if (when === "Today") {
    return "Paid today";
  }
  if (when === "Yesterday") {
    return "Paid yesterday";
  }

  return `Paid ${when}`;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },
  directionIcon: {
    flexShrink: 0,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  subtitleUrgent: {
    fontWeight: "600",
  },
  amountCol: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: "42%",
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
  dueDate: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.muted,
    lineHeight: 17,
  },
}));
