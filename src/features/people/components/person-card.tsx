import { memo } from "react";

import { Text, View } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { formatCurrency } from "@/lib/utils/formatters";

import type { PersonStatus } from "../lib/person-status";
import type { PersonListItemView } from "../view-models";

function buildSubtitle(person: PersonListItemView): string {
  if (person.status === "none") {
    return "No promises yet";
  }
  if (person.status === "settled") {
    return "All settled up";
  }

  const parts: string[] = [];
  if (person.openDebtCount > 0) {
    parts.push(person.openDebtCount === 1 ? "1 open" : `${person.openDebtCount} open`);
  }
  if (person.overdueCount > 0) {
    parts.push(person.overdueCount === 1 ? "1 overdue" : `${person.overdueCount} overdue`);
  } else if (person.status === "due-soon" && person.dueSoonCount > 0) {
    parts.push(person.dueSoonCount === 1 ? "1 due soon" : `${person.dueSoonCount} due soon`);
  }

  return parts.join(" · ");
}

function avatarColors(status: PersonStatus, theme: ReturnType<typeof useUnistyles>["theme"]) {
  if (status === "overdue" || status === "due-soon") {
    const config = theme.colors.personStatus[status];
    return { backgroundColor: config.bg, color: config.text };
  }

  return {
    backgroundColor: theme.colors.personNeutralBg,
    color: theme.colors.personNeutralText,
  };
}

type PersonCardProps = {
  person: PersonListItemView;
  onPress: () => void;
};

export const PersonCard = memo(({ person, onPress }: PersonCardProps) => {
  const { theme } = useUnistyles();
  const avatarStyle = avatarColors(person.status, theme);
  const showAmount = person.openDebtCount > 0;

  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: avatarStyle.backgroundColor }]}>
          <Text style={[styles.avatarText, { color: avatarStyle.color }]}>{person.initials}</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.contentRow}>
            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={1}>
                {person.name}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {buildSubtitle(person)}
              </Text>
            </View>
            {showAmount ? (
              <View style={styles.trailing}>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  numberOfLines={1}
                  style={styles.amount}
                >
                  {formatCurrency(person.outstanding)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </PressableScale>
  );
});

PersonCard.displayName = "PersonCard";

const styles = StyleSheet.create((theme) => ({
  card: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 17,
  },
  trailing: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: "42%",
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.text,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
}));
