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
  density?: "comfortable" | "compact";
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
    density = "comfortable",
    onPress,
    onAction,
    showDirectionCue = false,
    supportingText,
    supportingTextTone,
    style,
  }: DebtCardProps) => {
    const { theme } = useUnistyles();
    const isPaid = debt.status === "paid";
    const pct = debt.amount > 0 ? ((debt.amount - debt.remaining) / debt.amount) * 100 : 0;
    const DirectionIcon = debt.direction === "they_owe_me" ? ArrowDownLeft : ArrowUpRight;
    const directionColor =
      debt.direction === "they_owe_me" ? theme.colors.success : theme.colors.danger;

    const amountLabel = formatCurrency(isPaid ? debt.amount : debt.remaining, debt.currency);
    const directionLabel = debt.direction === "they_owe_me" ? "owes you" : "you owe";
    const accessibilityLabel = isPaid
      ? `${debt.name}, settled, ${amountLabel}`
      : `${debt.name}, ${directionLabel} ${amountLabel}`;

    const content = (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={[styles.card, density === "compact" ? styles.cardCompact : null, style]}
      >
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
                  <Text numberOfLines={1} style={[styles.name, isPaid ? styles.namePaid : null]}>
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
                  numberOfLines={1}
                  style={[styles.amount, isPaid ? styles.amountPaid : null]}
                >
                  {formatCurrency(isPaid ? debt.amount : debt.remaining, debt.currency)}
                </Text>
                <View style={styles.dueRow}>
                  <Text
                    style={[styles.dueDate, isPaid ? styles.dueDatePaid : null]}
                    numberOfLines={1}
                  >
                    {isPaid ? formatPaidWhen(debt.lastPaymentAt) : debt.dueDate}
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
  cardCompact: {
    paddingVertical: 10,
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
    gap: 12,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 4,
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
    minWidth: 0,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  namePaid: {
    color: theme.colors.muted,
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
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: "42%",
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 21,
    fontVariant: ["tabular-nums"],
  },
  amountPaid: {
    color: theme.colors.muted,
    textDecorationLine: "line-through",
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
  dueDatePaid: {
    color: theme.colors.paidText,
    fontWeight: "600",
  },
}));
