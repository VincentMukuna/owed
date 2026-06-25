import { memo } from "react";

import { Text, View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { formatCurrency } from "@/lib/utils/formatters";

import type { PersonListItemView } from "../view-models";
import { PersonStatusBadge } from "./person-status-badge";

function buildSummaryLine(person: PersonListItemView): string {
  if (person.status === "none") {
    return "No debts yet";
  }
  if (person.status === "settled") {
    return "Settled up";
  }

  const parts = [`${person.openDebtCount} active`];
  if (person.overdueCount > 0) {
    parts.push(`${person.overdueCount} overdue`);
  } else if (person.dueSoonCount > 0) {
    parts.push(`${person.dueSoonCount} due soon`);
  }

  return parts.join(" · ");
}

type PersonCardProps = {
  person: PersonListItemView;
  onPress: () => void;
};

export const PersonCard = memo(({ person, onPress }: PersonCardProps) => {
  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{person.initials}</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={1}>
                {person.name}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {buildSummaryLine(person)}
              </Text>
            </View>
            <View style={styles.amountCol}>
              {person.status !== "none" ? (
                <Text style={styles.amount}>{formatCurrency(person.outstanding)}</Text>
              ) : null}
              <Text style={styles.lastActivity}>Updated {person.lastActivity}</Text>
            </View>
          </View>

          {person.status !== "active" && person.status !== "none" ? (
            <View style={styles.footer}>
              <PersonStatusBadge status={person.status} />
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
});

PersonCard.displayName = "PersonCard";

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.personNeutralBg,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.personNeutralText,
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
    color: theme.colors.text,
    lineHeight: 18,
  },
  sub: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  lastActivity: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    marginTop: 2,
  },
  footer: {
    marginTop: 12,
  },
}));
